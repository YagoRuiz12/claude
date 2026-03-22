import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateBusinessSummary } from "@/lib/claude";
import OpenAI from "openai";
import { readFileSync, existsSync } from "fs";
import path from "path";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function loadOnboardingPersona(): string {
  const bundledPath = path.join(process.cwd(), "data", "agents", "onboarding-agent.md");
  if (existsSync(bundledPath)) return readFileSync(bundledPath, "utf-8");
  return `Você é Alex, o especialista de onboarding da SiruzTec. Colete o perfil de negócio do usuário de forma natural e ao final retorne: PROFILE_COMPLETE: {...json...}`;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { messages } = await req.json() as { messages: Message[] };

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Fallback when API key is not configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sua_chave_aqui") {
    return NextResponse.json({
      type: "message",
      content: "⚠️ Configure sua OPENAI_API_KEY no .env.local para ativar o onboarding com IA.",
    });
  }

  const systemPrompt = loadOnboardingPersona();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
  });

  const content = response.choices[0]?.message?.content ?? "";

  // Detect PROFILE_COMPLETE signal
  const profileMatch = content.match(/PROFILE_COMPLETE:\s*(\{[\s\S]*?\})/);
  if (profileMatch) {
    try {
      const profile = JSON.parse(profileMatch[1]);
      const cleanContent = content.replace(/PROFILE_COMPLETE:\s*\{[\s\S]*?\}/, "").trim();

      // Generate context summary
      const context_summary = await generateBusinessSummary(profile);

      // Save business profile
      await supabase.from("business_profiles").upsert({
        tenant_id: tenant.id,
        ...profile,
        context_summary,
        onboarding_completed: true,
        onboarding_messages: messages,
        partial_profile: {},
      }, { onConflict: "tenant_id" });

      return NextResponse.json({
        type: "complete",
        content: cleanContent || "Tudo pronto! Ativando sua equipe...",
        context_summary,
      });
    } catch {
      // JSON parse failed — fall through to normal message
    }
  }

  // Save partial progress (best-effort, fire and forget)
  supabase.from("business_profiles").upsert({
    tenant_id: tenant.id,
    onboarding_messages: messages,
    onboarding_completed: false,
    // Required fields with placeholder values for partial saves
    company_name: "—",
    industry: "—",
    size: "—",
    target_audience: "—",
    main_challenge: "—",
    goals: [],
    tone_of_voice: "—",
  }, { onConflict: "tenant_id", ignoreDuplicates: true }).then(() => {});

  return NextResponse.json({ type: "message", content });
}

