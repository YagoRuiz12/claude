import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createCheckoutSession, createFreelanceCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  // Contratação avulsa (freelance)
  if (body.type === "freelance") {
    const { agent_id, plan_tier } = body;
    if (!agent_id || !plan_tier) {
      return NextResponse.json({ error: "agent_id and plan_tier required" }, { status: 400 });
    }
    const session = await createFreelanceCheckoutSession({
      agentId: agent_id,
      planTier: plan_tier,
      tenantId: tenant.id,
      userId: user.id,
      email: user.email!,
      successUrl: `${origin}/dashboard/chat/${agent_id}?freelance=1`,
      cancelUrl: `${origin}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  }

  // Assinatura recorrente (fluxo padrão)
  const { plan } = body;
  const session = await createCheckoutSession({
    plan,
    tenantId: tenant.id,
    userId: user.id,
    email: user.email!,
    successUrl: `${origin}/dashboard?upgraded=1`,
    cancelUrl: `${origin}/precos`,
  });

  return NextResponse.json({ url: session.url });
}
