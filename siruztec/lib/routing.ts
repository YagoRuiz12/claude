import { getSquads } from "./agents";

// Map of agent IDs to their squad and display name — used for routing UI
export interface RoutingTarget {
  agent_id: string;
  agent_name: string;
  squad_id: string;
  squad_name: string;
  squad_icon: string;
}

export function resolveRoutingTarget(agentId: string): RoutingTarget | null {
  for (const squad of getSquads()) {
    const agent = squad.agents.find(a => a.id === agentId);
    if (agent) {
      return {
        agent_id: agent.id,
        agent_name: agent.name,
        squad_id: squad.id,
        squad_name: squad.name,
        squad_icon: squad.icon,
      };
    }
  }
  return null;
}

// Build a redirect URL for the dashboard chat page
export function buildChatUrl(agentId: string): string {
  return `/dashboard/chat/${agentId}`;
}
