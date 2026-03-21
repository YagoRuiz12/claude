import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PLAN_COLORS: Record<string, string> = {
  startup: "bg-emerald-500",
  scale: "bg-blue-500",
  dominance: "bg-violet-500",
};

const STATUS_COLORS: Record<string, string> = {
  trial: "bg-yellow-600",
  active: "bg-emerald-600",
  paused: "bg-zinc-600",
  cancelled: "bg-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  trial: "Trial",
  active: "Ativo",
  paused: "Pausado",
  cancelled: "Cancelado",
};

const PLAN_AGENT_COUNT: Record<string, string> = {
  startup: "12 agentes",
  scale: "60+ agentes",
  dominance: "144 agentes",
};

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect("/login");

  // Load all tenants with their profiles
  const { data: tenants } = await supabase
    .from("tenants")
    .select("*, business_profiles(company_name, industry, onboarding_completed)")
    .order("created_at", { ascending: false });

  const activeTenants = tenants?.filter(t => t.status === "active").length ?? 0;
  const trialTenants = tenants?.filter(t => t.status === "trial").length ?? 0;
  const totalTenants = tenants?.length ?? 0;

  // Revenue estimate
  const revenue = tenants?.reduce((acc, t) => {
    if (t.status !== "active") return acc;
    if (t.plan === "startup") return acc + 97;
    if (t.plan === "scale") return acc + 297;
    if (t.plan === "dominance") return acc + 697;
    return acc;
  }, 0) ?? 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-950 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black">🏢 SiruzTec</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-sm">Painel do Fundador</span>
        </div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-zinc-400">← Site</Button>
        </Link>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-black">Visão Geral</h1>
          <p className="text-zinc-400 mt-1">Todos os seus clientes, ao vivo.</p>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total de empresas", value: totalTenants, color: "text-white" },
            { label: "Empresas ativas", value: activeTenants, color: "text-emerald-400" },
            { label: "Em trial", value: trialTenants, color: "text-yellow-400" },
            { label: "MRR estimado", value: `R$${revenue.toLocaleString("pt-BR")}`, color: "text-violet-400" },
          ].map(kpi => (
            <Card key={kpi.label} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-5">
                <div className={`text-3xl font-black ${kpi.color}`}>{kpi.value}</div>
                <div className="text-xs text-zinc-400 mt-1">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tenant list */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Empresas ({totalTenants})</h2>
        </div>

        {totalTenants === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            <div className="text-4xl mb-3">🏢</div>
            <p>Nenhuma empresa cadastrada ainda.</p>
            <p className="text-sm mt-1">Compartilhe o link de cadastro para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tenants?.map(tenant => {
              const profile = Array.isArray(tenant.business_profiles)
                ? tenant.business_profiles[0]
                : tenant.business_profiles;

              return (
                <Link key={tenant.id} href={`/admin/tenants/${tenant.id}`}>
                  <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-white group-hover:text-violet-300 transition-colors">
                            {profile?.company_name ?? tenant.name}
                          </div>
                          {profile?.industry && (
                            <div className="text-xs text-zinc-500 mt-0.5">{profile.industry}</div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <Badge className={`${STATUS_COLORS[tenant.status]} text-white text-xs`}>
                            {STATUS_LABELS[tenant.status]}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={`${PLAN_COLORS[tenant.plan]} text-white text-xs`}>
                            {tenant.plan.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-zinc-500">{PLAN_AGENT_COUNT[tenant.plan]}</span>
                        </div>
                        <span className="text-xs text-zinc-600">
                          {profile?.onboarding_completed ? "✓ Onboarding" : "⚠ Sem onboarding"}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-zinc-600">
                        Criado em {new Date(tenant.created_at).toLocaleDateString("pt-BR")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
