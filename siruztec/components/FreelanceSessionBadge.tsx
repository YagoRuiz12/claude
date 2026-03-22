"use client";

interface FreelanceSessionBadgeProps {
  remaining: number;
  expiresAt?: string;
}

export default function FreelanceSessionBadge({ remaining, expiresAt }: FreelanceSessionBadgeProps) {
  const isLow = remaining <= 5;

  const expiryLabel = (() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours <= 0) return "expirando em breve";
    if (hours < 24) return `expira em ${hours}h`;
    return null;
  })();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
        isLow
          ? "border-amber-500/50 bg-amber-950/40 text-amber-400"
          : "border-emerald-500/50 bg-emerald-950/40 text-emerald-400"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      <span>Sessão freelancer</span>
      <span className="opacity-60">·</span>
      <span>{remaining} msg{remaining !== 1 ? "s" : ""} restante{remaining !== 1 ? "s" : ""}</span>
      {expiryLabel && (
        <>
          <span className="opacity-60">·</span>
          <span className="opacity-70">{expiryLabel}</span>
        </>
      )}
    </div>
  );
}
