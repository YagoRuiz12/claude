"use client";
import { useState } from "react";
import AgentNode from "./AgentNode";
import type { Squad } from "@/lib/agents";

interface SquadNodeProps {
  squad: Squad;
}

export default function SquadNode({ squad }: SquadNodeProps) {
  const [expanded, setExpanded] = useState(false);
  const unlockedCount = squad.agents.filter(a => !a.locked).length;
  const totalCount = squad.agents.length;

  return (
    <div
      className="rounded-2xl border bg-zinc-900 overflow-hidden transition-all"
      style={{ borderColor: squad.color + "55" }}
    >
      {/* Squad header — clickable to expand */}
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-zinc-800 transition-colors text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: squad.color + "22" }}
        >
          {squad.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white">{squad.name}</div>
          <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{squad.description}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs text-zinc-500">{unlockedCount}/{totalCount}</span>
          <span className="text-zinc-500 text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {/* Agents grid — shown when expanded */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800">
          <div className="pt-3 flex flex-wrap gap-2">
            {squad.agents.map(agent => (
              <AgentNode
                key={agent.id}
                agent={agent}
                squadColor={squad.color}
                squadIcon={squad.icon}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
