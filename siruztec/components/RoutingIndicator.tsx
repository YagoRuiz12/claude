"use client";

interface RoutingIndicatorProps {
  fromAgent: string;
  toAgent: string;
  toSquad: string;
  reason: string;
}

export default function RoutingIndicator({ fromAgent, toAgent, toSquad, reason }: RoutingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 my-3 px-3 py-2 bg-zinc-800 rounded-lg border border-zinc-700 text-sm">
      <span className="text-zinc-400 shrink-0">↪</span>
      <span className="text-zinc-400">
        <span className="text-zinc-300 font-medium">{fromAgent}</span>
        {" transferiu para "}
        <span className="text-violet-400 font-medium">{toAgent}</span>
        {toSquad && <span className="text-zinc-500"> ({toSquad})</span>}
      </span>
      {reason && <span className="text-zinc-600 ml-auto shrink-0 hidden md:block text-xs">{reason}</span>}
    </div>
  );
}
