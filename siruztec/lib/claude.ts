import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import os from 'os'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface BusinessProfile {
  company_name: string
  industry: string
  size: string
  target_audience: string
  main_challenge: string
  goals: string[]
  tone_of_voice: string
  context_summary?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  type: 'message' | 'route' | 'upgrade'
  content?: string
  agent?: string
  reason?: string
  upgrade_to?: string
  tokens_used?: number
}

function loadAgentPersona(agentId: string): string {
  // 1. Project-bundled personas (works on Vercel and locally)
  const bundledPath = path.join(process.cwd(), 'data', 'agents', `${agentId}.md`)
  if (existsSync(bundledPath)) {
    return readFileSync(bundledPath, 'utf-8')
  }
  // 2. Local ~/.claude/agents (works in local Claude Code sessions)
  const localPath = path.join(os.homedir(), '.claude', 'agents', agentId, `${agentId}.md`)
  if (existsSync(localPath)) {
    return readFileSync(localPath, 'utf-8')
  }
  // 3. Fallback generic persona
  return `Você é ${agentId}, um especialista de alta performance da SiruzTec. Responda com profundidade e expertise na sua área de especialização, sempre levando em consideração o contexto específico do negócio do cliente.`
}

function buildSystemPrompt(agentId: string, profile: BusinessProfile, plan: string): string {
  const persona = loadAgentPersona(agentId)

  return `${persona}

---
## CONTEXTO DO CLIENTE — LEIA E INTERNALIZE

Empresa: ${profile.company_name}
Segmento: ${profile.industry}
Tamanho: ${profile.size}
Público-alvo: ${profile.target_audience}
Principal desafio: ${profile.main_challenge}
Objetivos: ${profile.goals.join(', ')}
Tom de comunicação: ${profile.tone_of_voice}
${profile.context_summary ? `\nResumo contextual: ${profile.context_summary}` : ''}

## REGRAS DE OPERAÇÃO

1. Todas as suas respostas devem ser contextualizadas para este negócio específico.
2. Você está operando no nível "${plan}" da Empresa Virtual.
3. Se receber uma pergunta completamente fora da sua área de especialidade, responda normalmente mas ao final inclua uma linha em JSON puro:
   ROUTING: {"route_to": "id-do-agente", "reason": "motivo breve", "upgrade_hint": null}
4. Se o usuário precisaria de um especialista que só está disponível em um plano superior, inclua:
   ROUTING: {"route_to": "id-do-agente", "reason": "motivo", "upgrade_hint": "scale" ou "dominance"}
5. NUNCA quebre o personagem. Você é este especialista, não uma IA genérica.
`
}

export async function chat(
  agentId: string,
  messages: Message[],
  profile: BusinessProfile,
  plan: string
): Promise<ChatResponse> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sua_chave_aqui') {
    return {
      type: 'message',
      content: '⚠️ Configure sua ANTHROPIC_API_KEY no arquivo .env.local para ativar os agentes. Acesse console.anthropic.com para criar sua chave.'
    }
  }

  const systemPrompt = buildSystemPrompt(agentId, profile, plan)

  // Sliding context window: keep last 15 messages + context_summary injected via system prompt
  const recentMessages = messages.slice(-15)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: systemPrompt,
    messages: recentMessages.map(m => ({ role: m.role, content: m.content }))
  })

  const content = response.content[0].type === 'text' ? response.content[0].text : ''
  const tokensUsed = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)

  // Check for routing instruction at end of response (match last occurrence)
  const routingMatch = content.match(/ROUTING:\s*(\{[^}]+\})\s*$/)
  if (routingMatch) {
    try {
      const routing = JSON.parse(routingMatch[1])
      const cleanContent = content.replace(/ROUTING:\s*\{[^}]+\}\s*$/, '').trim()

      if (routing.upgrade_hint) {
        return {
          type: 'upgrade',
          content: cleanContent,
          agent: routing.route_to,
          reason: routing.reason,
          upgrade_to: routing.upgrade_hint,
          tokens_used: tokensUsed,
        }
      }

      return {
        type: 'route',
        content: cleanContent,
        agent: routing.route_to,
        reason: routing.reason,
        tokens_used: tokensUsed,
      }
    } catch {
      // If JSON parse fails, return as normal message
    }
  }

  return { type: 'message', content, tokens_used: tokensUsed }
}

export async function generateBusinessSummary(profile: Omit<BusinessProfile, 'context_summary'>): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'sua_chave_aqui') {
    return `${profile.company_name} é uma empresa de ${profile.industry} focada em ${profile.target_audience}.`
  }

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `Crie um contexto conciso (3-4 frases) para especialistas de uma empresa virtual que vão assessorar este negócio:

Empresa: ${profile.company_name}
Segmento: ${profile.industry}
Tamanho: ${profile.size}
Público-alvo: ${profile.target_audience}
Principal desafio: ${profile.main_challenge}
Objetivos: ${profile.goals.join(', ')}
Tom: ${profile.tone_of_voice}

Escreva em português, direto ao ponto, como se fosse um briefing interno para a equipe de especialistas.`
    }]
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}
