"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getFreelancePrice } from "@/lib/agents";

const PLAN_COLORS: Record<string, string> = {
  scale: "border-blue-500 bg-blue-950/40",
  dominance: "border-violet-500 bg-violet-950/40",
};

const PLAN_LABELS: Record<string, string> = {
  scale: "SCALE — R$297/mês",
  dominance: "DOMINANCE — R$697/mês",
};

interface UpgradePromptProps {
  agentId: string;
  agentName: string;
  reason: string;
  upgradeTo: string;
}

export default function UpgradePrompt({ agentId, agentName, reason, upgradeTo }: UpgradePromptProps) {
  const { planTier, priceLabel } = getFreelancePrice(agentId);

  async function handleHire() {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "freelance", agent_id: agentId, plan_tier: planTier }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <div className={`rounded-xl border p-4 my-3 ${PLAN_COLORS[upgradeTo] ?? "border-zinc-700 bg-zinc-800"}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">🔒</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm mb-1">
            {agentName} disponível no {PLAN_LABELS[upgradeTo] ?? upgradeTo}
          </p>
          <p className="text-xs text-zinc-400 mb-3">{reason}</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              onClick={handleHire}
            >
              ⚡ Contratar por {priceLabel} · 1 sessão (20 msgs)
            </Button>
            <Link href={`/checkout?plan=${upgradeTo}`}>
              <Button
                size="sm"
                className={upgradeTo === "scale" ? "bg-blue-600 hover:bg-blue-700" : "bg-violet-600 hover:bg-violet-700"}
              >
                Expandir minha empresa →
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
