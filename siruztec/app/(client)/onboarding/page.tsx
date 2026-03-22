import OnboardingChat from "@/components/OnboardingChat";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Top bar */}
      <div className="h-1 bg-zinc-800">
        <div className="h-full bg-violet-500 w-[5%]" />
      </div>
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-950">
        <span className="text-xl font-black">🏢 SiruzTec</span>
        <span className="text-xs text-zinc-500">Configuração inicial · ~5 min</span>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <OnboardingChat />
      </div>
    </div>
  );
}
