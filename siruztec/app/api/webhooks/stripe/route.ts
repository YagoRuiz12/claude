import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  // Idempotency: skip already-processed events
  const { data: alreadyProcessed } = await supabase
    .from("processed_stripe_events")
    .select("id")
    .eq("event_id", event.id)
    .single();
  if (alreadyProcessed) {
    return NextResponse.json({ received: true });
  }

  // Mark event as processed first (prevents duplicate processing on retry)
  await supabase.from("processed_stripe_events").insert({ event_id: event.id });

  // Checkout completado
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { tenant_id, plan, type: sessionType, agent_id } = session.metadata ?? {};

    if (sessionType === "freelance" && tenant_id && agent_id) {
      // Contratação avulsa: criar sessão freelancer (unique stripe_payment_id garante idempotência)
      await supabase.from("freelance_sessions").upsert({
        tenant_id,
        agent_id,
        stripe_payment_id: session.payment_intent as string,
        messages_used: 0,
        messages_limit: 20,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: "stripe_payment_id", ignoreDuplicates: true });
    } else if (tenant_id && plan) {
      // Assinatura: ativar plano
      await supabase.from("tenants").update({
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        plan,
        status: "active",
      }).eq("id", tenant_id);
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase.from("tenants").update({
      status: sub.status === "active" ? "active" : "paused",
    }).eq("stripe_subscription_id", sub.id);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await supabase.from("tenants").update({ status: "cancelled" })
      .eq("stripe_subscription_id", sub.id);
  }

  return NextResponse.json({ received: true });
}
