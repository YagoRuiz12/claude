"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const PROFILE_FIELDS = [
  { key: "company_name", label: "Empresa" },
  { key: "industry", label: "Segmento" },
  { key: "size", label: "Tamanho" },
  { key: "target_audience", label: "Público" },
  { key: "main_challenge", label: "Desafio" },
  { key: "goals", label: "Objetivos" },
  { key: "tone_of_voice", label: "Tom de voz" },
];

// Very lightweight heuristics to show checkmarks as conversation progresses
function detectCollectedFields(messages: Message[]): Set<string> {
  const collected = new Set<string>();
  const allText = messages.map(m => m.content.toLowerCase()).join(" ");
  if (allText.includes("nome") || allText.includes("empresa") || allText.includes("negócio")) {
    const hasAnswer = messages.some(m => m.role === "user" && m.content.length > 2);
    if (hasAnswer) collected.add("company_name");
  }
  if (allText.includes("segmento") || allText.includes("setor") || allText.includes("área")) collected.add("industry");
  if (allText.includes("equipe") || allText.includes("tamanho") || allText.includes("pessoas") || allText.includes("funcionários")) collected.add("size");
  if (allText.includes("cliente") || allText.includes("público") || allText.includes("persona")) collected.add("target_audience");
  if (allText.includes("desafio") || allText.includes("dificuldade") || allText.includes("travando") || allText.includes("problema")) collected.add("main_challenge");
  if (allText.includes("objetivo") || allText.includes("meta") || allText.includes("crescer") || allText.includes("quero")) collected.add("goals");
  if (allText.includes("tom") || allText.includes("comunicação") || allText.includes("linguagem") || allText.includes("estilo")) collected.add("tone_of_voice");
  return collected;
}

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Oi! Sou o Alex, e nos próximos minutos vou preparar sua equipe de 144 especialistas para o seu negócio. Pode me contar: **qual é o nome da sua empresa e o que ela faz?**",
};

export default function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const collectedFields = detectCollectedFields(messages);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (complete) {
      const timer = setTimeout(() => router.push("/dashboard"), 2000);
      return () => clearTimeout(timer);
    }
  }, [complete, router]);

  async function sendMessage() {
    if (!input.trim() || loading || complete) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/onboarding/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    });

    const data = await res.json();
    setLoading(false);

    if (data.type === "complete") {
      setMessages(m => [
        ...m,
        { role: "assistant", content: data.content },
        {
          role: "assistant",
          content: "✅ Perfil salvo! Ativando seus 144 especialistas... Você será redirecionado em instantes.",
        },
      ]);
      setComplete(true);
    } else {
      setMessages(m => [...m, { role: "assistant", content: data.content }]);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function renderContent(text: string) {
    // Simple bold markdown support
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex h-full gap-0">
      {/* Progress Sidebar (desktop only) */}
      <aside className="hidden lg:flex flex-col w-52 border-r border-zinc-800 bg-zinc-950 p-5 shrink-0">
        <div className="mb-6">
          <div className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Coletando</div>
          <div className="text-sm font-semibold text-white">Perfil do negócio</div>
        </div>
        <ul className="space-y-3">
          {PROFILE_FIELDS.map(f => {
            const done = collectedFields.has(f.key);
            return (
              <li key={f.key} className="flex items-center gap-2">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    done
                      ? "border-emerald-500 bg-emerald-500/20"
                      : "border-zinc-700 bg-transparent"
                  }`}
                >
                  {done && <span className="text-[9px] text-emerald-400">✓</span>}
                </div>
                <span className={`text-xs transition-colors ${done ? "text-zinc-300" : "text-zinc-600"}`}>
                  {f.label}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto pt-4">
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-500"
              style={{ width: `${(collectedFields.size / PROFILE_FIELDS.length) * 100}%` }}
            />
          </div>
          <div className="text-xs text-zinc-600 mt-1">{collectedFields.size}/{PROFILE_FIELDS.length} campos</div>
        </div>
      </aside>

      {/* Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
          <div className="w-9 h-9 rounded-full bg-violet-900/50 border border-violet-700 flex items-center justify-center text-base">
            🧭
          </div>
          <div>
            <div className="font-semibold text-white text-sm">Alex · Onboarding</div>
            <div className="text-xs text-zinc-500">Preparando seus especialistas</div>
          </div>
          {/* Mobile progress dots */}
          <div className="ml-auto flex gap-1 lg:hidden">
            {PROFILE_FIELDS.map(f => (
              <div
                key={f.key}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  collectedFields.has(f.key) ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-4">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-violet-900/50 border border-violet-800 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
                  🧭
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                }`}
              >
                <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start mb-4">
              <div className="w-7 h-7 rounded-full bg-violet-900/50 border border-violet-800 flex items-center justify-center text-xs mr-2 mt-1 shrink-0">
                🧭
              </div>
              <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </ScrollArea>

        {/* Input */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={complete ? "Redirecionando..." : "Digite sua resposta..."}
              disabled={loading || complete}
              className="flex-1 bg-zinc-800 border-zinc-700 text-white resize-none min-h-[44px] max-h-[120px] disabled:opacity-50"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim() || complete}
              className="bg-violet-600 hover:bg-violet-700 shrink-0"
            >
              Enviar
            </Button>
          </div>
          <p className="text-xs text-zinc-600 mt-1">Enter para enviar · Shift+Enter para nova linha</p>
        </div>
      </div>
    </div>
  );
}
