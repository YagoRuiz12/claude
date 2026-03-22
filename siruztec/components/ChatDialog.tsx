"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import RoutingIndicator from "./RoutingIndicator";
import UpgradePrompt from "./UpgradePrompt";
import FreelanceSessionBadge from "./FreelanceSessionBadge";
import { resolveRoutingTarget, buildChatUrl } from "@/lib/routing";
import { useRouter } from "next/navigation";
import type { Squad } from "@/lib/agents";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RoutingEvent {
  type: "route" | "upgrade";
  fromAgent: string;
  toAgent: string;
  toSquadName: string;
  reason: string;
  upgradeTo?: string;
}

interface ChatDialogProps {
  agentId: string;
  agentName: string;
  squad: Squad;
  initialFreelanceRemaining?: number | null;
}

export default function ChatDialog({ agentId, agentName, squad, initialFreelanceRemaining }: ChatDialogProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [routingEvents, setRoutingEvents] = useState<Map<number, RoutingEvent>>(new Map());
  const [upgradeInfo, setUpgradeInfo] = useState<{ agentId: string; agentName: string; reason: string; upgradeTo: string } | null>(null);
  const [freelanceRemaining, setFreelanceRemaining] = useState<number | null>(initialFreelanceRemaining ?? null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setUpgradeInfo(null);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent_id: agentId, messages: newMessages }),
    });

    const data = await res.json();
    setLoading(false);

    // Update freelance remaining count if API returned it
    if (typeof data.freelance_remaining === "number") {
      setFreelanceRemaining(data.freelance_remaining);
    }

    if (data.type === "message") {
      setMessages(m => [...m, { role: "assistant", content: data.content }]);
    } else if (data.type === "route") {
      const target = resolveRoutingTarget(data.agent);
      setMessages(m => [...m, { role: "assistant", content: data.content ?? "" }]);
      const routingEvent: RoutingEvent = {
        type: "route",
        fromAgent: agentName,
        toAgent: target?.agent_name ?? data.agent,
        toSquadName: target?.squad_name ?? "",
        reason: data.reason ?? "",
      };
      setRoutingEvents(prev => new Map(prev).set(newMessages.length, routingEvent));
      setTimeout(() => router.push(buildChatUrl(data.agent)), 2000);
    } else if (data.type === "upgrade") {
      const target = resolveRoutingTarget(data.agent);
      setMessages(m => [...m, { role: "assistant", content: data.content ?? "" }]);
      setUpgradeInfo({
        agentId: data.agent,
        agentName: target?.agent_name ?? data.agent,
        reason: data.reason ?? "",
        upgradeTo: data.upgrade_to ?? "scale",
      });
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
          style={{ backgroundColor: squad.color + "33", color: squad.color }}
        >
          {squad.icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-white">{agentName}</div>
          <div className="text-xs text-zinc-400">{squad.name}</div>
        </div>
        {freelanceRemaining !== null && (
          <FreelanceSessionBadge remaining={freelanceRemaining} />
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {messages.length === 0 && (
          <div className="text-center text-zinc-500 mt-12">
            <div className="text-4xl mb-3">{squad.icon}</div>
            <p className="font-medium text-zinc-400">{agentName}</p>
            <p className="text-sm mt-1">Como posso ajudar seu negócio hoje?</p>
            {freelanceRemaining !== null && (
              <p className="text-xs text-emerald-500 mt-2">⚡ Sessão freelancer ativa · {freelanceRemaining} mensagens disponíveis</p>
            )}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            <div className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-violet-600 text-white rounded-br-sm"
                    : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                }`}
              >
                {msg.content && <div className="whitespace-pre-wrap">{msg.content}</div>}
              </div>
            </div>
            {routingEvents.has(i) && (
              <RoutingIndicator
                fromAgent={routingEvents.get(i)!.fromAgent}
                toAgent={routingEvents.get(i)!.toAgent}
                toSquad={routingEvents.get(i)!.toSquadName}
                reason={routingEvents.get(i)!.reason}
              />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        {upgradeInfo && (
          <UpgradePrompt
            agentId={upgradeInfo.agentId}
            agentName={upgradeInfo.agentName}
            reason={upgradeInfo.reason}
            upgradeTo={upgradeInfo.upgradeTo}
          />
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
            placeholder={`Pergunte ao ${agentName}...`}
            className="flex-1 bg-zinc-800 border-zinc-700 text-white resize-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-700 shrink-0"
          >
            Enviar
          </Button>
        </div>
        <p className="text-xs text-zinc-600 mt-1">Enter para enviar · Shift+Enter para nova linha</p>
      </div>
    </div>
  );
}
