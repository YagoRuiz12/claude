import squadsData from '@/data/squads.json'

export type Plan = 'startup' | 'scale' | 'dominance'

export interface Agent {
  id: string
  name: string
  title: string
  tier: number
  role: 'orchestrator' | 'specialist'
  locked?: boolean
}

export interface Squad {
  id: string
  name: string
  icon: string
  description: string
  chief: string
  color: string
  agents: Agent[]
  scale_agents: string[]
  workflows: string[]
  tags: string[]
}

export function getSquads(): Squad[] {
  return squadsData.squads as Squad[]
}

export function getSquadsForPlan(plan: Plan): Squad[] {
  const squads = getSquads()
  return squads.map(squad => ({
    ...squad,
    agents: getAgentsForPlan(plan, squad)
  }))
}

export function getAgentsForPlan(plan: Plan, squad: Squad): Agent[] {
  if (plan === 'startup') {
    return squad.agents.map(agent => ({
      ...agent,
      locked: agent.role !== 'orchestrator' && agent.id !== squad.chief
    }))
  }

  if (plan === 'scale') {
    const allowed = new Set(squad.scale_agents)
    return squad.agents.map(agent => ({
      ...agent,
      locked: !allowed.has(agent.id)
    }))
  }

  // dominance: all agents unlocked
  return squad.agents.map(agent => ({ ...agent, locked: false }))
}

export function getAgentById(agentId: string): Agent | null {
  for (const squad of getSquads()) {
    const agent = squad.agents.find(a => a.id === agentId)
    if (agent) return agent
  }
  return null
}

export function getSquadByAgentId(agentId: string): Squad | null {
  return getSquads().find(s => s.agents.some(a => a.id === agentId)) ?? null
}

export function isAgentAvailable(plan: Plan, agentId: string): boolean {
  const squad = getSquadByAgentId(agentId)
  if (!squad) return false

  if (plan === 'dominance') return true
  if (plan === 'scale') return squad.scale_agents.includes(agentId)
  // startup: only chiefs
  return squad.chief === agentId
}

export function getUpgradeHint(currentPlan: Plan, agentId: string): string | null {
  if (isAgentAvailable(currentPlan, agentId)) return null
  if (currentPlan === 'startup') return 'scale'
  if (currentPlan === 'scale') return 'dominance'
  return null
}

export interface FreelanceSession {
  id: string
  agent_id: string
  messages_used: number
  messages_limit: number
  expires_at: string
}

/** Returns true if the agent is accessible either via plan or an active freelance session */
export function isAgentAccessibleWithFreelance(
  plan: Plan,
  agentId: string,
  freelanceSessions: FreelanceSession[]
): boolean {
  if (isAgentAvailable(plan, agentId)) return true
  const now = new Date()
  return freelanceSessions.some(
    s =>
      s.agent_id === agentId &&
      s.messages_used < s.messages_limit &&
      new Date(s.expires_at) > now
  )
}

/** Returns the active freelance session for a given agent, if any */
export function getActiveFreelanceSession(
  agentId: string,
  freelanceSessions: FreelanceSession[]
): FreelanceSession | null {
  const now = new Date()
  return (
    freelanceSessions.find(
      s =>
        s.agent_id === agentId &&
        s.messages_used < s.messages_limit &&
        new Date(s.expires_at) > now
    ) ?? null
  )
}

/** Price in BRL cents for a freelance session based on which plan the agent belongs to */
export function getFreelancePrice(agentId: string): { planTier: string; priceLabel: string } {
  const squad = getSquadByAgentId(agentId)
  if (!squad) return { planTier: 'scale', priceLabel: 'R$19' }
  // If agent is in scale_agents list → R$19, otherwise (dominance-only) → R$39
  if (squad.scale_agents.includes(agentId)) {
    return { planTier: 'scale', priceLabel: 'R$19' }
  }
  return { planTier: 'dominance', priceLabel: 'R$39' }
}
