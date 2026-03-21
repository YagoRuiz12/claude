import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getSquadsForPlan } from "@/lib/agents";
import OrgChart from "@/components/OrgChart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PLAN_COLORS: Record<string, string> = {
  startup: "bg-emerald-500",
  scale: "bg-blue-500",
  dominance: "bg-violet-500",
};

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, name, plan, status")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) redirect("/cadastro");

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("company_name, onboarding_completed")
    .eq("tenant_id", tenant.id)
    .single();

  if (!profile?.onboarding_completed) redirect("/onboarding");

  const squads = getSquadsForPlan(tenant.plan as "startup" | "scale" | "dominance");

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top nav */}
      <nav className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between bg-zinc-950 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black">🏢 SiruzTec</span>
          <span className="text-zinc-600">·</span>
          <span className="text-sm text-zinc-400">{profile.company_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${PLAN_COLORS[tenant.plan]} text-white text-xs`}>
            {tenant.plan.toUpperCase()}
          </Badge>
          {tenant.plan !== "dominance" && (
            <Link href={`/checkout?plan=${tenant.plan === "startup" ? "scale" : "dominance"}`}>
              <Button size="sm" variant="outline" className="border-zinc-700 text-xs">
                Expandir empresa ↑
              </Button>
            </Link>
          )}
          <form action="/api/auth/signout" method="POST">
            <Button size="sm" variant="ghost" className="text-zinc-400 text-xs">Sair</Button>
          </form>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-1">Sua empresa, {profile.company_name}</h1>
          <p className="text-zinc-400">
            Clique em qualquer departamento para ver os especialistas disponíveis no seu plano.
          </p>
        </div>

        <OrgChart squads={squads} plan={tenant.plan} />

        {/* Quick access to unlocked chiefs */}
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-4 text-zinc-300">Acesso rápido — Chiefs de departamento</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {squads.map(squad => {
              const chief = squad.agents.find(a => a.tier === 0);
              if (!chief) return null;
              return (
                <Link key={squad.id} href={`/dashboard/chat/${chief.id}`}>
                  <div className="flex flex-col items-center gap-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800 transition-all text-center cursor-pointer group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{squad.icon}</span>
                    <span className="text-xs text-zinc-300 leading-tight">{squad.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
