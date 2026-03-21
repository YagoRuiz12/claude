"use client";
import Link from "next/link";
import type { Agent } from "@/lib/agents";

interface AgentNodeProps {
  agent: Agent;
  squadColor: string;
  squadIcon: string;
}

export default function AgentNode({ agent, squadColor, squadIcon }: AgentNodeProps) {
  if (agent.locked) {
    return (
      <div className="relative flex flex-col items-center gap-1 p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed select-none">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: "#52525233" }}
        >
          🔒
        </div>
        <span className="text-xs text-zinc-600 text-center leading-tight max-w-[70px] truncate">{agent.name}</span>
      </div>
    );
  }

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
      </div>
    </Link>
  );
}
