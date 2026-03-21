import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await req.json();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

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
