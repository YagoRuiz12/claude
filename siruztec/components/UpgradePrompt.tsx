"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PLAN_COLORS: Record<string, string> = {
  scale: "border-blue-500 bg-blue-950/40",
  dominance: "border-violet-500 bg-violet-950/40",
};

const PLAN_LABELS: Record<string, string> = {
  scale: "SCALE — R$297/mês",
  dominance: "DOMINANCE — R$697/mês",
};

interface UpgradePromptProps {
  agentName: string;
  reason: string;
  upgradeTo: string;
}

export default function UpgradePrompt({ agentName, reason, upgradeTo }: UpgradePromptProps) {
  return (
    <div className={`rounded-xl border p-4 my-3 ${PLAN_COLORS[upgradeTo] ?? "border-zinc-700 bg-zinc-800"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm mb-1">
            {agentName} disponível no {PLAN_LABELS[upgradeTo] ?? upgradeTo}
          </p>
          <p className="text-xs text-zinc-400 mb-3">{reason}</p>
          <Link href={`/checkout?plan=${upgradeTo}`}>
            <Button size="sm" className={upgradeTo === "scale" ? "bg-blue-600 hover:bg-blue-700" : "bg-violet-600 hover:bg-violet-700"}>
              Expandir minha empresa →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
