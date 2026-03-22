"use client";
import Link from "next/link";
import type { Agent } from "@/lib/agents";
import { getFreelancePrice } from "@/lib/agents";

interface AgentNodeProps {
  agent: Agent;
  squadColor: string;
  squadIcon: string;
  hasFreelanceSession?: boolean;
}

export default function AgentNode({ agent, squadColor, squadIcon, hasFreelanceSession }: AgentNodeProps) {
  if (agent.locked && !hasFreelanceSession) {
    const { priceLabel } = getFreelancePrice(agent.id);

    async function handleHire(e: React.MouseEvent) {
      e.preventDefault();
      const { planTier } = getFreelancePrice(agent.id);
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "freelance", agent_id: agent.id, plan_tier: planTier }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    }

    return (
      <div className="relative flex flex-col items-center gap-1 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 opacity-60 select-none group/locked cursor-default">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: "#52525233" }}
        >
          🔒
        </div>
        <span className="text-xs text-zinc-600 text-center leading-tight max-w-[70px] truncate">{agent.name}</span>
        <button
          onClick={handleHire}
          className="mt-1 text-[9px] text-zinc-500 hover:text-emerald-400 transition-colors opacity-0 group-hover/locked:opacity-100 whitespace-nowrap"
          title={`Contratar por ${priceLabel}`}
        >
          ⚡ {priceLabel}
        </button>
      </div>
    );
  }

  // Unlocked (via plan or active freelance session)
  return (
    <Link href={`/dashboard/chat/${agent.id}`}>
      <div className="flex flex-col items-center gap-1 p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 transition-all cursor-pointer group">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform"
          style={{ backgroundColor: squadColor + "33", color: squadColor }}
        >
          {agent.tier === 0 ? "👑" : squadIcon}
        </div>
        <span className="text-xs text-zinc-300 text-center leading-tight max-w-[70px] truncate group-hover:text-white">
          {agent.name}
        </span>
        {agent.tier === 0 && (
          <span className="text-[9px] text-zinc-500 uppercase tracking-wide">Chief</span>
        )}
        {hasFreelanceSession && (
          <span className="text-[9px] text-emerald-500 uppercase tracking-wide">⚡ Freelancer</span>
        )}
      </div>
    </Link>
  );
}
