"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const GOALS = [
  "Aumentar vendas", "Gerar mais leads", "Melhorar branding",
  "Reduzir custos", "Escalar operações", "Lançar novo produto",
  "Melhorar retenção", "Entrar em novos mercados",
];

const TONES = [
  { id: "professional", label: "Profissional", desc: "Formal e técnico" },
  { id: "friendly", label: "Amigável", desc: "Próximo e acessível" },
  { id: "bold", label: "Ousado", desc: "Direto e impactante" },
  { id: "inspiring", label: "Inspirador", desc: "Emotivo e motivador" },
];

const SIZES = ["Solo (1 pessoa)", "Micro (2-10)", "Pequena (11-50)", "Média (51-200)", "Grande (200+)"];

const INDUSTRIES = [
  "E-commerce", "SaaS / Tech", "Serviços", "Saúde", "Educação",
  "Imobiliário", "Finanças", "Gastronomia", "Moda", "Outro",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    size: "",
    goals: [] as string[],
    target_audience: "",
    main_challenge: "",
    tone_of_voice: "",
  });

  function toggleGoal(g: string) {
    setForm(f => ({
      ...f,
      goals: f.goals.includes(g) ? f.goals.filter(x => x !== g) : [...f.goals, g],
    }));
  }

  async function handleFinish() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!tenant) { setLoading(false); return; }

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenant.id, ...form }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setLoading(false);
    }
  }

  const progress = (step / 5) * 100;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-violet-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-zinc-500 text-sm">Passo {step} de 5</span>
            <span className="text-2xl font-black">🏢 SiruzTec</span>
          </div>

          {/* Step 1: Company info */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black mb-2">Sobre sua empresa</h1>
                <p className="text-zinc-400">Vamos especializar seus 144 agentes para o seu negócio.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-1">Nome da empresa</label>
                  <Input
                    placeholder="Ex: Agência Nova Era"
                    value={form.company_name}
                    onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Segmento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map(ind => (
                      <button
                        key={ind}
                        onClick={() => setForm(f => ({ ...f, industry: ind }))}
                        className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                          form.industry === ind
                            ? "border-violet-500 bg-violet-900/30 text-violet-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">Tamanho da equipe</label>
                  <div className="grid grid-cols-1 gap-2">
                    {SIZES.map(s => (
                      <button
                        key={s}
                        onClick={() => setForm(f => ({ ...f, size: s }))}
                        className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                          form.size === s
                            ? "border-violet-500 bg-violet-900/30 text-violet-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={!form.company_name || !form.industry || !form.size}
                onClick={() => setStep(2)}
              >
                Continuar →
              </Button>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black mb-2">Seus objetivos agora</h1>
                <p className="text-zinc-400">Selecione todos que se aplicam. Seus agentes priorizarão isso.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(g => (
                  <button
                    key={g}
                    onClick={() => toggleGoal(g)}
                    className={`p-4 rounded-lg border text-sm text-left transition-colors ${
                      form.goals.includes(g)
                        ? "border-violet-500 bg-violet-900/30 text-violet-300"
                        : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {form.goals.includes(g) ? "✓ " : ""}{g}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-zinc-700" onClick={() => setStep(1)}>← Voltar</Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  disabled={form.goals.length === 0}
                  onClick={() => setStep(3)}
                >
                  Continuar →
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Target audience */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black mb-2">Seu cliente ideal</h1>
                <p className="text-zinc-400">Quanto mais específico, mais precisos serão os seus agentes.</p>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Quem é seu cliente ideal?</label>
                <Textarea
                  placeholder="Ex: Donos de e-commerce de moda feminina, faturando R$50k-500k/mês, que querem escalar com anúncios pagos mas não sabem por onde começar."
                  value={form.target_audience}
                  onChange={e => setForm(f => ({ ...f, target_audience: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Tom de comunicação da sua marca</label>
                <div className="grid grid-cols-2 gap-3">
                  {TONES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setForm(f => ({ ...f, tone_of_voice: t.id }))}
                      className={`p-4 rounded-lg border text-left transition-colors ${
                        form.tone_of_voice === t.id
                          ? "border-violet-500 bg-violet-900/30"
                          : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"
                      }`}
                    >
                      <div className="font-semibold text-sm">{t.label}</div>
                      <div className="text-xs text-zinc-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-zinc-700" onClick={() => setStep(2)}>← Voltar</Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  disabled={!form.target_audience || !form.tone_of_voice}
                  onClick={() => setStep(4)}
                >
                  Continuar →
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Challenge */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black mb-2">Seu principal desafio</h1>
                <p className="text-zinc-400">O que está travando o crescimento do seu negócio hoje?</p>
              </div>
              <div>
                <Textarea
                  placeholder="Ex: Gasto muito com anúncios mas minhas campanhas não convertem. Preciso melhorar minha copy e entender melhor meu público."
                  value={form.main_challenge}
                  onChange={e => setForm(f => ({ ...f, main_challenge: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white min-h-[120px]"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="border-zinc-700" onClick={() => setStep(3)}>← Voltar</Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                  disabled={!form.main_challenge}
                  onClick={() => setStep(5)}
                >
                  Continuar →
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black mb-2">Tudo pronto! 🚀</h1>
                <p className="text-zinc-400">Vou agora especializar seus 144 agentes para a {form.company_name}.</p>
              </div>

              <Card className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-5 space-y-3 text-sm">
                  <div className="flex gap-2"><span className="text-zinc-500">Empresa:</span><span className="text-white">{form.company_name}</span></div>
                  <div className="flex gap-2"><span className="text-zinc-500">Segmento:</span><span className="text-white">{form.industry}</span></div>
                  <div className="flex gap-2"><span className="text-zinc-500">Objetivos:</span><span className="text-white">{form.goals.join(", ")}</span></div>
                  <div className="flex gap-2"><span className="text-zinc-500">Desafio:</span><span className="text-white line-clamp-2">{form.main_challenge}</span></div>
                </CardContent>
              </Card>

              <div className="bg-zinc-800 rounded-lg p-4 text-sm text-zinc-400 border border-zinc-700">
                <div className="flex items-center gap-2 text-violet-400 font-semibold mb-1">
                  🧠 Claude vai agora...
                </div>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Gerar um briefing contextual completo</li>
                  <li>Injetar o contexto em todos os 144 especialistas</li>
                  <li>Ativar sua empresa virtual</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="border-zinc-700" onClick={() => setStep(4)}>← Voltar</Button>
                <Button
                  className="flex-1 bg-violet-600 hover:bg-violet-700 text-base py-5"
                  onClick={handleFinish}
                  disabled={loading}
                >
                  {loading ? "Ativando sua empresa..." : "Ativar minha empresa →"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
