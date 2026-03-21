import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sobre — SiruzTec",
  description: "A SiruzTec é uma plataforma que coloca 144 especialistas de IA ao serviço do seu negócio, organizados em 12 departamentos e personalizados para a sua empresa.",
};

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <nav className="border-b border-zinc-800 px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold">🏢 SiruzTec</Link>
        <div className="flex gap-4">
          <Link href="/precos"><Button variant="ghost" size="sm">Preços</Button></Link>
          <Link href="/cadastro"><Button size="sm" className="bg-violet-600 hover:bg-violet-700">Começar grátis</Button></Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-black mb-6">
          O que é a<br />
          <span className="text-violet-400">SiruzTec?</span>
        </h1>

        <div className="space-y-6 text-zinc-300 leading-relaxed">
          <p className="text-xl">
            A SiruzTec é uma plataforma SaaS que coloca{" "}
            <strong className="text-white">144 especialistas de inteligência artificial</strong>{" "}
            ao serviço do seu negócio — organizados em 12 departamentos, trabalhando 24h por dia, especializados na realidade da sua empresa.
          </p>

          <p>
            Não é um chatbot genérico. Cada especialista tem uma personalidade, área de domínio e forma de raciocinar únicas.
            David Ogilvy escreve diferente de Gary Halbert. Pedro Sobral pensa diferente de Márcio Motta.
            Quando você precisa de copy de alta conversão, vai falar com David — não com um assistente genérico.
          </p>

          <p>
            No onboarding de 5 minutos, você descreve seu negócio, seu público e seus desafios.
            A IA gera um briefing completo e injeta esse contexto em todos os 144 especialistas.
            A partir desse momento, cada um responde considerando a realidade da sua empresa.
          </p>

          <div className="border-l-4 border-violet-500 pl-6 py-2 my-8">
            <p className="text-xl font-semibold text-white">
              "Não vendemos um software. Vendemos uma empresa."
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-10">Os 12 departamentos</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["✍️", "Copy Squad", "Copywriters lendários"],
              ["💰", "Hormozi Squad", "Ofertas e estratégia de vendas"],
              ["📢", "Traffic Masters", "Facebook, Google, YouTube Ads"],
              ["🎯", "Brand Squad", "Posicionamento e identidade"],
              ["🏛️", "C-Suite", "COO, CMO, CTO, CIO virtuais"],
              ["🧠", "Advisory Board", "Thiel, Naval, Dalio, Munger"],
              ["📖", "Storytelling", "Narrativa e pitch"],
              ["🔒", "Cybersecurity", "Pentest e segurança"],
              ["🎨", "Design Squad", "UX, UI e design systems"],
              ["📊", "Data Squad", "Analytics e growth"],
              ["🔥", "Movement", "Comunidade e propósito"],
              ["⚙️", "Claude Code", "Automação e agentes de IA"],
            ].map(([icon, name, desc]) => (
              <div key={name} className="flex items-start gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <div className="font-semibold text-sm text-white">{name}</div>
                  <div className="text-xs text-zinc-400">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mt-10">Routing automático entre agentes</h2>
          <p>
            Quando você pergunta algo ao agente errado, ele não simplesmente ignora ou responde pela metade.
            Ele transfere automaticamente para o colega mais qualificado, com uma explicação do motivo.
            É uma equipe de verdade — não um atendimento robotizado.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10">Construído para crescer com você</h2>
          <p>
            Comece com o plano STARTUP (12 especialistas generalistas). Quando precisar de profundidade,
            mude para SCALE (60+ especialistas). Quando quiser o máximo, DOMINANCE desbloqueia todos os 144.
            O upgrade é instantâneo — sem migração, sem burocracia.
          </p>
        </div>

        <div className="mt-16 text-center">
          <Link href="/cadastro">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-lg px-10 py-6">
              Ativar minha empresa →
            </Button>
          </Link>
          <p className="text-zinc-500 text-sm mt-3">7 dias grátis · Sem cartão de crédito</p>
        </div>
      </main>

      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-zinc-500 text-sm">
        <p>© 2025 SiruzTec · 144 especialistas de IA para o seu negócio</p>
        <p className="mt-2">
          <Link href="/" className="hover:text-white mx-2">Início</Link>
          <Link href="/precos" className="hover:text-white mx-2">Preços</Link>
          <Link href="/login" className="hover:text-white mx-2">Entrar</Link>
        </p>
      </footer>
    </div>
  );
}
