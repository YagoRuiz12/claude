import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateBusinessSummary } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { tenant_id, company_name, industry, size, target_audience, main_challenge, goals, tone_of_voice } = body;

  // Verify tenant belongs to user
  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenant_id)
    .eq("owner_id", user.id)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Generate context summary via Claude
  const context_summary = await generateBusinessSummary({
    company_name, industry, size, target_audience, main_challenge, goals, tone_of_voice,
  });

  // Upsert business profile
  const { error } = await supabase.from("business_profiles").upsert({
    tenant_id,
    company_name,
    industry,
    size,
    target_audience,
    main_challenge,
    goals,
    tone_of_voice,
    context_summary,
    onboarding_completed: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, context_summary });
}
