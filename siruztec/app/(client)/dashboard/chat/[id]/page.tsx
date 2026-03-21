import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getAgentById, getSquadByAgentId, getSquadsForPlan, isAgentAvailable } from "@/lib/agents";
import ChatDialog from "@/components/ChatDialog";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, plan")
    .eq("owner_id", user.id)
    .single();

  if (!tenant) redirect("/dashboard");

  const agent = getAgentById(id);
  const squad = getSquadByAgentId(id);

  if (!agent || !squad) redirect("/dashboard");

  // If agent is locked, redirect back with message
  if (!isAgentAvailable(tenant.plan as "startup" | "scale" | "dominance", id)) {
    redirect("/dashboard");
  }

  const squads = getSquadsForPlan(tenant.plan as "startup" | "scale" | "dominance");
  const squadWithPlan = squads.find(s => s.id === squad.id) ?? squad;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Breadcrumb nav */}
      <nav className="border-b border-zinc-800 px-4 py-3 flex items-center gap-2 text-sm bg-zinc-950 sticky top-0 z-10">
        <Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">
          ← Minha Empresa
        </Link>
        <span className="text-zinc-700">/</span>
        <span className="text-zinc-400">{squadWithPlan.name}</span>
        <span className="text-zinc-700">/</span>
        <span className="text-white font-semibold">{agent.name}</span>
      </nav>

      {/* Chat fills remaining height */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <ChatDialog
          agentId={agent.id}
          agentName={agent.name}
          squad={squadWithPlan}
        />
      </div>
    </div>
  );
}
