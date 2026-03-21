import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const squads = [
  { icon: "✍️", name: "Copy Squad", desc: "David Ogilvy, Gary Halbert, Eugene Schwartz e +20 copywriters lendários" },
  { icon: "💰", name: "Hormozi Squad", desc: "Ofertas irresistíveis, leads, pricing e estratégias de escala" },
  { icon: "📢", name: "Traffic Masters", desc: "Facebook, Google, YouTube Ads com Pedro Sobral e +14 especialistas" },
  { icon: "🎯", name: "Brand Squad", desc: "Posicionamento, identidade e naming com Aaker, Neumeier e Al Ries" },
  { icon: "🏛️", name: "C-Suite", desc: "COO, CMO, CTO, CIO e CAIO virtuais para decisões executivas" },
  { icon: "🧠", name: "Advisory Board", desc: "Peter Thiel, Naval, Ray Dalio e Charlie Munger como conselheiros" },
  { icon: "📖", name: "Storytelling", desc: "Jornada do herói, pitch e narrativa com Joseph Campbell e Dan Harmon" },
  { icon: "🔒", name: "Cybersecurity", desc: "Pentest, AppSec e resposta a incidentes com 15 especialistas" },
  { icon: "🎨", name: "Design Squad", desc: "UX, UI e design systems com Brad Frost e Dan Mall" },
  { icon: "📊", name: "Data Squad", desc: "Analytics, growth e retenção com Avinash Kaushik e Peter Fader" },
  { icon: "🔥", name: "Movement", desc: "Comunidade, propósito e identidade de marca" },
  { icon: "⚙️", name: "Claude Code", desc: "Automação, MCP e orquestração de agentes com o Swarm Orchestrator" },
];

const plans = [
  {
    name: "STARTUP",
    color: "bg-emerald-500",
    price: "R$97",
    description: "Sua empresa entra em operação.",
    detail: "12 especialistas generalistas — um por departamento. Cada um cobre sua área completa.",
    cta: "Ativar minha empresa",
    agents: "12 chefs",
    highlight: false,
  },
  {
    name: "SCALE",
    color: "bg-blue-500",
    price: "R$297",
    description: "Especialistas para cada desafio.",
    detail: "Chiefs + 4-6 especialistas por squad. Roteamento automático para o expert certo.",
    cta: "Especializar minha equipe",
    agents: "60+ especialistas",
    highlight: true,
  },
  {
    name: "DOMINANCE",
    color: "bg-violet-500",
    price: "R$697",
    description: "144 especialistas. Um CEO orquestrando tudo.",
    detail: "Acesso total. Projetos multi-squad. CEO que coordena campanhas completas de lançamento.",
    cta: "Dominar meu mercado",
    agents: "144 especialistas",
    highlight: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <span className="text-xl font-bold">🏢 SiruzTec</span>
        <div className="flex gap-4">
          <Link href="/precos"><Button variant="ghost" size="sm">Preços</Button></Link>
          <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
          <Link href="/cadastro"><Button size="sm" className="bg-violet-600 hover:bg-violet-700">Começar agora</Button></Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <Badge className="mb-6 bg-violet-900 text-violet-300 border-violet-700">
          144 especialistas de IA · 12 departamentos
        </Badge>
        <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
          Contrate uma empresa inteira.<br />
          <span className="text-violet-400">Pague por uma assinatura.</span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
          Copywriters lendários, estrategistas de negócio, especialistas em tráfego, branding e segurança —
          todos especializados no seu negócio após um onboarding de 5 minutos.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/cadastro">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-8 py-6">
              Ativar minha empresa →
            </Button>
          </Link>
          <Link href="/precos">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-zinc-700">
              Ver os níveis
            </Button>
          </Link>
        </div>
      </section>

      {/* Squads grid */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Seus 12 departamentos</h2>
        <p className="text-zinc-400 text-center mb-12">Cada departamento tem um chief orquestrador e especialistas de classe mundial.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {squads.map((squad) => (
            <Card key={squad.name} className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="text-3xl mb-2">{squad.icon}</div>
                <h3 className="font-semibold mb-1">{squad.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{squad.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-12">Como funciona</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Onboarding em 5 min", desc: "Conte sobre seu negócio, público-alvo e desafios. Claude especializa os 144 agentes para o seu contexto." },
            { step: "2", title: "Clique no especialista", desc: "Org chart visual com todos os agentes. Clique em qualquer um para abrir uma conversa especializada." },
            { step: "3", title: "Routing automático", desc: "Se o assunto é de outro especialista, o agente transfere automaticamente para o colega certo." },
          ].map((item) => (
            <div key={item.step} className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-xl font-black">{item.step}</div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-zinc-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 py-16" id="precos">
        <h2 className="text-3xl font-bold text-center mb-4">Escolha o nível da sua ambição</h2>
        <p className="text-zinc-400 text-center mb-12">Sua empresa cresce junto com você.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`border-2 ${plan.highlight ? "border-blue-500 bg-zinc-900" : "border-zinc-800 bg-zinc-900"}`}>
              <CardContent className="p-6 flex flex-col gap-4">
                <Badge className={`${plan.color} text-white w-fit`}>{plan.name}</Badge>
                <div>
                  <span className="text-4xl font-black">{plan.price}</span>
                  <span className="text-zinc-400">/mês</span>
                </div>
                <p className="font-semibold">{plan.description}</p>
                <p className="text-sm text-zinc-400">{plan.detail}</p>
                <p className="text-sm font-medium text-violet-400">{plan.agents} disponíveis</p>
                <Link href="/cadastro">
                  <Button className={`w-full ${plan.highlight ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-700 hover:bg-zinc-600"}`}>
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ para SEO */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Perguntas frequentes</h2>
        <div className="space-y-6">
          {[
            { q: "O que é a SiruzTec?", a: "É uma plataforma SaaS onde cada cliente recebe uma empresa completa com 144 especialistas de IA organizados em 12 departamentos. Os agentes são personalizados para o negócio do cliente durante um onboarding inicial." },
            { q: "Como os agentes são especializados no meu negócio?", a: "No onboarding de 5 minutos, você conta sobre sua empresa, público-alvo e desafios. Claude processa esse contexto e injeta em todos os 144 especialistas, fazendo com que cada um responda considerando a realidade do seu negócio." },
            { q: "O que é o routing automático entre agentes?", a: "Se você pergunta ao David Ogilvy sobre precificação, ele responde o que sabe E sugere transferir para o especialista de pricing do Hormozi Squad. O frontend redireciona automaticamente para o colega mais qualificado." },
            { q: "Qual a diferença entre STARTUP, SCALE e DOMINANCE?", a: "STARTUP: um chief por departamento, atuando como generalista. SCALE: chief + 4-6 especialistas por squad com roteamento preciso. DOMINANCE: todos os 144 especialistas + CEO orquestrando projetos multi-squad." },
            { q: "Posso usar agentes de IA para minha empresa?", a: "Sim. A SiruzTec é a forma mais completa de ter especialistas de IA trabalhando pelo seu negócio. Desde copywriters clássicos como David Ogilvy até conselheiros como Peter Thiel e Naval Ravikant." },
          ].map((faq) => (
            <div key={faq.q} className="border-b border-zinc-800 pb-6">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-4xl font-black mb-4">Sua empresa começa hoje.</h2>
        <p className="text-zinc-400 mb-8">Onboarding em 5 minutos. Agentes ativos imediatamente.</p>
        <Link href="/cadastro">
          <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-10 py-6">
            Ativar minha SiruzTec →
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-zinc-500 text-sm">
        <p>© 2025 SiruzTec · 144 especialistas de IA para o seu negócio</p>
        <p className="mt-2">
          <Link href="/precos" className="hover:text-white mx-2">Preços</Link>
          <Link href="/sobre" className="hover:text-white mx-2">Sobre</Link>
          <Link href="/login" className="hover:text-white mx-2">Entrar</Link>
        </p>
      </footer>
    </div>
  );
}
