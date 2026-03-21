import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { chat } from "@/lib/claude";
import { isAgentAvailable } from "@/lib/agents";
import type { Message } from "@/lib/claude";

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

  // Check agent access
  if (!isAgentAvailable(tenant.plan, agent_id)) {
    const upgradeHint = tenant.plan === "startup" ? "scale" : "dominance";
    return NextResponse.json({
      type: "upgrade",
      agent: agent_id,
      reason: "Este especialista não está disponível no seu plano atual.",
      upgrade_to: upgradeHint,
    });
  }

  // Call Claude
  const response = await chat(agent_id, messages as Message[], profile, tenant.plan);

  // Log usage (fire and forget)
  supabase.from("usage_logs").insert({
    tenant_id: tenant.id,
    agent_id,
    tokens_used: 0, // TODO: use actual token count from response
  }).then(() => {});

  // Persist conversation
  if (conversation_id) {
    supabase.from("conversations").update({
      messages,
      updated_at: new Date().toISOString(),
    }).eq("id", conversation_id).then(() => {});
  }

  return NextResponse.json(response);
}
