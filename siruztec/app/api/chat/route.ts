import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { chat } from "@/lib/claude";
import { isAgentAvailable, isAgentAccessibleWithFreelance, getActiveFreelanceSession } from "@/lib/agents";
import type { Message } from "@/lib/claude";
import type { FreelanceSession } from "@/lib/agents";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agent_id, messages, conversation_id } = await req.json();

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

  // If using a freelance session, check messages remaining and increment
  const activeSession = isAgentAvailable(tenant.plan, agent_id)
    ? null
    : getActiveFreelanceSession(agent_id, sessions);

  if (activeSession) {
    const remaining = activeSession.messages_limit - activeSession.messages_used;
    if (remaining <= 0) {
      const upgradeHint = tenant.plan === "startup" ? "scale" : "dominance";
      return NextResponse.json({
        type: "upgrade",
        agent: agent_id,
        reason: "Sua sessão freelancer esgotou. Contrate novamente ou expanda para um plano.",
        upgrade_to: upgradeHint,
      });
    }
    // Increment usage (fire and forget)
    supabase
      .from("freelance_sessions")
      .update({ messages_used: activeSession.messages_used + 1 })
      .eq("id", activeSession.id)
      .then(() => {});
  }

  // Call Claude
  const response = await chat(agent_id, messages as Message[], profile, tenant.plan);

  // Attach freelance_remaining if applicable
  const freelanceRemaining = activeSession
    ? activeSession.messages_limit - activeSession.messages_used - 1
    : null;

  // Log usage (fire and forget)
  supabase.from("usage_logs").insert({
    tenant_id: tenant.id,
    agent_id,
    tokens_used: 0,
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
