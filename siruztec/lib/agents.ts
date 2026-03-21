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
