import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

const PRICE_IDS: Record<string, string> = {
  startup: process.env.STRIPE_STARTUP_PRICE_ID!,
  scale: process.env.STRIPE_SCALE_PRICE_ID!,
  dominance: process.env.STRIPE_DOMINANCE_PRICE_ID!,
};

const FREELANCE_PRICE_IDS: Record<string, string> = {
  scale: process.env.STRIPE_FREELANCE_SCALE_PRICE_ID!,
  dominance: process.env.STRIPE_FREELANCE_DOMINANCE_PRICE_ID!,
};

export async function createCheckoutSession({
  plan,
  tenantId,
  userId,
  email,
  successUrl,
  cancelUrl,
}: {
  plan: string;
  tenantId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    metadata: { tenant_id: tenantId, user_id: userId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}

export async function createFreelanceCheckoutSession({
  agentId,
  planTier,
  tenantId,
  userId,
  email,
  successUrl,
  cancelUrl,
}: {
  agentId: string;
  planTier: string;
  tenantId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: FREELANCE_PRICE_IDS[planTier], quantity: 1 }],
    metadata: { tenant_id: tenantId, user_id: userId, agent_id: agentId, type: "freelance" },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
  return session;
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}
