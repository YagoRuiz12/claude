import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Preços — SiruzTec",
  description: "Escolha o nível da sua empresa: STARTUP (R$97), SCALE (R$297) ou DOMINANCE (R$697). 144 especialistas de IA ao seu serviço.",
};

const plans = [
  {
    name: "STARTUP",
    color: "bg-emerald-500",
    borderColor: "border-emerald-900",
    price: "R$97",
    tagline: "Sua empresa entra em operação.",
    description: "12 chefs de departamento atuando como generalistas. Um especialista completo em cada área, pronto para qualquer desafio do seu negócio.",
    agents: "12 especialistas",
    highlight: false,
    features: [
      "1 chief por departamento (12 no total)",
      "Copy, Vendas, Tráfego, Brand, Tech, Dados...",
      "Routing automático entre departamentos",
      "Onboarding de 5 minutos",
      "Agentes especializados no seu negócio",
      "7 dias de trial grátis",
    ],
  },
  {
    name: "SCALE",
    color: "bg-blue-500",
    borderColor: "border-blue-600",
    price: "R$297",
    tagline: "Especialistas para cada desafio.",
    description: "Chief + 4-6 especialistas por squad. O agente certo para cada tipo de pedido — mais precisão, menos generalismo.",
    agents: "60+ especialistas",
    highlight: true,
    features: [
      "Tudo do STARTUP, mais:",
      "David Ogilvy, Gary Halbert, Dan Kennedy",
      "Pedro Sobral, Márcio Motta (tráfego)",
      "Peter Thiel, Naval Ravikant (advisory)",
      "Roteamento automático para o expert exato",
      "Projetos de até 2 squads simultâneos",
    ],
  },
  {
    name: "DOMINANCE",
    color: "bg-violet-500",
    borderColor: "border-violet-900",
    price: "R$697",
    tagline: "144 especialistas. Uma empresa completa.",
    description: "Todos os 144 agentes + CEO orquestrando projetos multi-squad. Lançamentos completos, rebrandings, expansões — a empresa mais poderosa que você pode ter.",
    agents: "144 especialistas",
    highlight: false,
    features: [
      "Tudo do SCALE, mais:",
      "Todos os 144 especialistas desbloqueados",
      "CEO Virtual para projetos multi-squad",
      "Lançamentos completos (copy + tráfego + brand)",
      "Advisory Board completo (Thiel, Dalio, Munger)",
      "Prioridade no suporte",
    ],
  },
];

export default function PrecosPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold">🏢 SiruzTec</Link>
        <div className="flex gap-4">
          <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link href="/cadastro"><Button size="sm" className="bg-violet-600 hover:bg-violet-700">Começar grátis</Button></Link>
        </div>
      </nav>

      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <Badge className="mb-6 bg-violet-900 text-violet-300 border-violet-700">
          7 dias grátis em qualquer plano
        </Badge>
        <h1 className="text-4xl md:text-5xl font-black mb-4">
          Escolha o nível da sua ambição
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Não é um plano de software. É o tamanho da equipe da sua empresa.
          Comece pequeno, escale quando precisar.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <Card
              key={plan.name}
              className={`border-2 bg-zinc-900 relative ${plan.highlight ? plan.borderColor : "border-zinc-800"}`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Mais popular</Badge>
                </div>
              )}
              <CardContent className="p-6 flex flex-col gap-4">
                <Badge className={`${plan.color} text-white w-fit`}>{plan.name}</Badge>
                <div>
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-zinc-400">/mês</span>
                </div>
                <p className="font-semibold text-white">{plan.tagline}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{plan.description}</p>
                <p className="text-sm font-medium text-violet-400">{plan.agents} disponíveis</p>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastro" className="mt-auto">
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-blue-600 hover:bg-blue-700"
                        : plan.name === "DOMINANCE"
                        ? "bg-violet-600 hover:bg-violet-700"
                        : "bg-zinc-700 hover:bg-zinc-600"
                    }`}
                  >
                    Começar com {plan.name} →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Todos os planos incluem 7 dias grátis · Cancele quando quiser · Sem fidelidade
        </p>
      </section>

      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Dúvidas sobre os planos</h2>
        <div className="space-y-6">
          {[
            { q: "Posso mudar de plano depois?", a: "Sim. Você pode fazer upgrade ou downgrade a qualquer momento. O novo plano entra em vigor imediatamente e a cobrança é proporcional ao período." },
            { q: "O que acontece com meus agentes se eu mudar de plano?", a: "No upgrade, novos agentes são desbloqueados instantaneamente. No downgrade, os agentes do plano superior são bloqueados, mas seu histórico de conversas é preservado." },
            { q: "Os agentes realmente se especializam no meu negócio?", a: "Sim. No onboarding de 5 minutos, você descreve sua empresa, público e desafios. Claude gera um briefing completo que é injetado em todos os seus especialistas — eles passam a responder considerando a realidade do seu negócio." },
            { q: "Preciso de cartão de crédito para o trial?", a: "Não. O trial de 7 dias é gratuito e sem necessidade de cartão. Ao final do período, você escolhe se quer continuar com um plano pago." },
          ].map(faq => (
            <div key={faq.q} className="border-b border-zinc-800 pb-6">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-zinc-500 text-sm">
        <p>© 2025 SiruzTec · 144 especialistas de IA para o seu negócio</p>
        <p className="mt-2">
          <Link href="/" className="hover:text-white mx-2">Início</Link>
          <Link href="/sobre" className="hover:text-white mx-2">Sobre</Link>
          <Link href="/login" className="hover:text-white mx-2">Entrar</Link>
        </p>
      </footer>
    </div>
  );
}
