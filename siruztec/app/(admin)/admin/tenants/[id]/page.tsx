import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PLAN_COLORS: Record<string, string> = {
  startup: "bg-emerald-500",
  scale: "bg-blue-500",
  dominance: "bg-violet-500",
};

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Ativo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TenantDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", id)
    .single();

  if (!tenant) notFound();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("*")
    .eq("tenant_id", id)
    .single();

  const { data: usageLogs } = await supabase
    .from("usage_logs")
    .select("agent_id, tokens_used, created_at")
    .eq("tenant_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: conversations } = await supabase
    .from("conversations")
    .select("agent_id, created_at, updated_at")
    .eq("tenant_id", id)
    .order("updated_at", { ascending: false })
    .limit(10);

  const totalTokens = usageLogs?.reduce((acc, l) => acc + (l.tokens_used ?? 0), 0) ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-3 bg-zinc-950 sticky top-0 z-10">
        <Link href="/admin" className="text-zinc-400 hover:text-white transition-colors text-sm">
          ← Painel
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-white font-semibold">{profile?.company_name ?? tenant.name}</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black">{profile?.company_name ?? tenant.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${PLAN_COLORS[tenant.plan]} text-white`}>{tenant.plan.toUpperCase()}</Badge>
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">{STATUS_LABELS[tenant.status]}</Badge>
              {profile?.industry && <span className="text-zinc-500 text-sm">{profile.industry}</span>}
            </div>
          </div>
          {tenant.stripe_customer_id && (
            <a
              href={`https://dashboard.stripe.com/customers/${tenant.stripe_customer_id}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
                Ver no Stripe ↗
              </Button>
            </a>
          )}
        </div>

        {/* Business profile */}
        {profile && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <h2 className="font-bold mb-4 text-zinc-200">Perfil do Negócio</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Segmento", value: profile.industry },
                  { label: "Tamanho", value: profile.size },
                  { label: "Público-alvo", value: profile.target_audience },
                  { label: "Desafio principal", value: profile.main_challenge },
                  { label: "Tom de voz", value: profile.tone_of_voice },
                  { label: "Objetivos", value: profile.goals?.join(", ") },
                ].map(item => item.value && (
                  <div key={item.label}>
                    <div className="text-zinc-500 text-xs mb-0.5">{item.label}</div>
                    <div className="text-zinc-300">{item.value}</div>
                  </div>
                ))}
              </div>
              {profile.context_summary && (
                <div className="mt-4 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                  <div className="text-xs text-zinc-500 mb-1">Resumo contextual (gerado pela IA)</div>
                  <p className="text-sm text-zinc-300 leading-relaxed">{profile.context_summary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Usage stats */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { label: "Total de tokens", value: totalTokens.toLocaleString("pt-BR"), icon: "⚡" },
            { label: "Conversas", value: conversations?.length ?? 0, icon: "💬" },
            { label: "Interações", value: usageLogs?.length ?? 0, icon: "📊" },
          ].map(stat => (
            <Card key={stat.label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-4 flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <div className="font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-zinc-400">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent conversations */}
        {conversations && conversations.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <h2 className="font-bold mb-4 text-zinc-200">Conversas recentes</h2>
              <div className="space-y-2">
                {conversations.map((conv, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0 text-sm">
                    <span className="text-zinc-300 font-mono">{conv.agent_id}</span>
                    <span className="text-zinc-500 text-xs">
                      {new Date(conv.updated_at).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
