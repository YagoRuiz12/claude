import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { chat } from "@/lib/claude";
import { isAgentAvailable, isAgentAccessibleWithFreelance, getActiveFreelanceSession } from "@/lib/agents";
import type { Message } from "@/lib/claude";
import type { FreelanceSession } from "@/lib/agents";

const DAILY_LIMITS: Record<string, number> = {
  startup: 50,
  scale: 200,
  dominance: 1000,
};

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agent_id, messages, conversation_id } = await req.json();

  if (!agent_id || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Fetch tenant + business profile
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, plan, status")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  if (tenant.status === "cancelled") {
    return NextResponse.json({ error: "Subscription cancelled" }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("tenant_id", tenant.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Complete onboarding first" }, { status: 400 });

  // Rate limiting: check daily message count against plan limit
  const { data: todayCount } = await supabase.rpc("count_messages_today", {
    p_tenant_id: tenant.id,
  });
  const dailyLimit = DAILY_LIMITS[tenant.plan] ?? 50;
  if ((todayCount ?? 0) >= dailyLimit) {
    return NextResponse.json({
      type: "upgrade",
      reason: `Você atingiu o limite de ${dailyLimit} mensagens/dia do plano ${tenant.plan.toUpperCase()}. Expanda seu plano para continuar.`,
      upgrade_to: tenant.plan === "startup" ? "scale" : "dominance",
    }, { status: 429 });
  }

  // Fetch active freelance sessions for this tenant
  const now = new Date().toISOString();
  const { data: freelanceSessions } = await supabase
    .from("freelance_sessions")
    .select("id, agent_id, messages_used, messages_limit, expires_at")
    .eq("tenant_id", tenant.id)
    .gt("expires_at", now);

  const sessions: FreelanceSession[] = (freelanceSessions ?? []) as FreelanceSession[];

  // Check agent access (plan OR active freelance session)
  if (!isAgentAccessibleWithFreelance(tenant.plan, agent_id, sessions)) {
    const upgradeHint = tenant.plan === "startup" ? "scale" : "dominance";
    return NextResponse.json({
      type: "upgrade",
      agent: agent_id,
      reason: "Este especialista não está disponível no seu plano atual.",
      upgrade_to: upgradeHint,
    });
  }

  // If using a freelance session, atomically increment usage
  const usingFreelance = !isAgentAvailable(tenant.plan, agent_id);
  const preCheckSession = usingFreelance
    ? getActiveFreelanceSession(agent_id, sessions)
    : null;

  let freelanceRemaining: number | null = null;

  if (usingFreelance) {
    if (!preCheckSession || preCheckSession.messages_used >= preCheckSession.messages_limit) {
      const upgradeHint = tenant.plan === "startup" ? "scale" : "dominance";
      return NextResponse.json({
        type: "upgrade",
        agent: agent_id,
        reason: "Sua sessão freelancer esgotou. Contrate novamente ou expanda para um plano.",
        upgrade_to: upgradeHint,
      });
    }
    // Atomic increment — prevents race condition
    const { data: updated } = await supabase.rpc("increment_freelance_usage", {
      p_session_id: preCheckSession.id,
    });
    if (!updated || (updated as { messages_used: number }[]).length === 0) {
      const upgradeHint = tenant.plan === "startup" ? "scale" : "dominance";
      return NextResponse.json({
        type: "upgrade",
        agent: agent_id,
        reason: "Sua sessão freelancer esgotou. Contrate novamente ou expanda para um plano.",
        upgrade_to: upgradeHint,
      });
    }
    const updatedSession = (updated as { messages_used: number; messages_limit: number }[])[0];
    freelanceRemaining = updatedSession.messages_limit - updatedSession.messages_used;
  }

  // Call Claude
  const response = await chat(agent_id, messages as Message[], profile, tenant.plan);

  // Log real token usage
  supabase.from("usage_logs").insert({
    tenant_id: tenant.id,
    agent_id,
    tokens_used: response.tokens_used ?? 0,
  }).then(() => {});

  // Persist conversation
  if (conversation_id) {
    supabase.from("conversations").update({
      messages,
      updated_at: new Date().toISOString(),
    }).eq("id", conversation_id).then(() => {});
  }

  return NextResponse.json({ ...response, freelance_remaining: freelanceRemaining });
}
