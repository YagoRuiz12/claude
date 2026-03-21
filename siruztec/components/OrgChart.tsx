"use client";
import SquadNode from "./SquadNode";
import type { Squad } from "@/lib/agents";

interface OrgChartProps {
  squads: Squad[];
  plan: string;
}

export default function OrgChart({ squads, plan }: OrgChartProps) {
  const totalAgents = squads.reduce((acc, s) => acc + s.agents.length, 0);
  const unlockedAgents = squads.reduce((acc, s) => acc + s.agents.filter(a => !a.locked).length, 0);

  return (
    <div>
      {/* Summary bar */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-zinc-900 rounded-xl border border-zinc-800">
        <div className="text-center">
          <div className="text-2xl font-black text-white">{unlockedAgents}</div>
          <div className="text-xs text-zinc-400">especialistas ativos</div>
        </div>
        <div className="w-px h-8 bg-zinc-700" />
        <div className="text-center">
          <div className="text-2xl font-black text-zinc-500">{totalAgents - unlockedAgents}</div>
          <div className="text-xs text-zinc-500">bloqueados</div>
        </div>
        <div className="w-px h-8 bg-zinc-700" />
        <div className="text-center">
          <div className="text-2xl font-black" style={{ color: plan === "dominance" ? "#a855f7" : plan === "scale" ? "#3b82f6" : "#10b981" }}>
            {plan.toUpperCase()}
          </div>
          <div className="text-xs text-zinc-400">seu plano</div>
        </div>
        <div className="ml-auto text-xs text-zinc-500 hidden md:block">
          Clique em um departamento para ver os especialistas
        </div>
      </div>

      {/* Squads grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {squads.map(squad => (
          <SquadNode key={squad.id} squad={squad} />
        ))}
      </div>
    </div>
  );
}
