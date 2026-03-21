"""
Agent runner: executes tasks using the Anthropic API with agentic loop.
Broadcasts real-time events to the dashboard via WebSocket.
"""

import anthropic
from datetime import datetime
from typing import Callable, Awaitable, Any

from .models import AgentState, AgentStatus, AgentConfig, SystemConfig

# Mapping from config tool names → Claude API tool definitions
SERVER_TOOLS = {
    "web_search": {"type": "web_search_20260209", "name": "web_search"},
    "web_fetch": {"type": "web_fetch_20260209", "name": "web_fetch"},
    "code_execution": {"type": "code_execution_20260120", "name": "code_execution"},
}

Broadcast = Callable[[dict], Awaitable[None]]


def build_system_prompt(agent_cfg: AgentConfig, sys_cfg: SystemConfig) -> str:
    parts = []
    if sys_cfg.global_system_prompt:
        parts.append(sys_cfg.global_system_prompt)
    if agent_cfg.system_prompt:
        parts.append(agent_cfg.system_prompt)
    parts.append(f"\nBusiness context: {sys_cfg.name} — {sys_cfg.description}")
    return "\n\n".join(parts)


def build_tools(tool_names: list[str]) -> list[dict] | None:
    tools = [SERVER_TOOLS[t] for t in tool_names if t in SERVER_TOOLS]
    return tools if tools else None


async def run_agent_task(
    agent_id: str,
    agent_state: AgentState,
    agent_cfg: AgentConfig,
    sys_cfg: SystemConfig,
    broadcast: Broadcast,
    active_agents: dict[str, AgentState],
) -> None:
    """Run an agent task with streaming and broadcast events to dashboard."""
    client = anthropic.AsyncAnthropic()
    tools = build_tools(agent_cfg.tools)
    system = build_system_prompt(agent_cfg, sys_cfg)
    messages: list[dict] = [{"role": "user", "content": agent_state.task}]

    try:
        turn = 0
        while turn < agent_cfg.max_turns:
            turn += 1
            agent_state.turn = turn
            active_agents[agent_id] = agent_state

            await broadcast({
                "type": "agent_turn",
                "agent_id": agent_id,
                "turn": turn,
            })

            create_kwargs: dict[str, Any] = {
                "model": sys_cfg.model,
                "max_tokens": 8192,
                "system": system,
                "messages": messages,
            }
            if tools:
                create_kwargs["tools"] = tools

            async with client.messages.stream(**create_kwargs) as stream:
                async for event in stream:
                    # Stream text tokens
                    if event.type == "content_block_delta":
                        delta = event.delta
                        if hasattr(delta, "text") and delta.text:
                            await broadcast({
                                "type": "agent_text",
                                "agent_id": agent_id,
                                "text": delta.text,
                            })

                    # Tool/block starts
                    elif event.type == "content_block_start":
                        block = event.content_block
                        btype = getattr(block, "type", "")
                        if btype == "server_tool_use":
                            await broadcast({
                                "type": "tool_start",
                                "agent_id": agent_id,
                                "tool": getattr(block, "name", btype),
                            })

                response = await stream.get_final_message()

            # Append assistant turn
            messages.append({"role": "assistant", "content": response.content})

            # Collect tool results from response content
            for block in response.content:
                btype = getattr(block, "type", "")

                if btype == "web_search_tool_result":
                    snippet = _extract_web_result(block)
                    await broadcast({
                        "type": "tool_result",
                        "agent_id": agent_id,
                        "tool": "web_search",
                        "snippet": snippet,
                    })

                elif btype == "bash_code_execution_tool_result":
                    content = getattr(block, "content", None)
                    stdout = ""
                    if content and hasattr(content, "stdout"):
                        stdout = content.stdout[:500]
                    await broadcast({
                        "type": "tool_result",
                        "agent_id": agent_id,
                        "tool": "code_execution",
                        "snippet": stdout or "(no output)",
                    })

                elif btype == "tool_use":
                    # Custom (non-server) tool — not implemented yet
                    await broadcast({
                        "type": "tool_start",
                        "agent_id": agent_id,
                        "tool": getattr(block, "name", "tool"),
                    })

            stop = response.stop_reason

            if stop == "end_turn":
                break
            elif stop == "pause_turn":
                # Server-side tool loop hit limit, re-send to continue
                continue
            elif stop == "tool_use":
                # Future: handle custom client-side tools here
                break
            else:
                break

        # Done
        agent_state.status = AgentStatus.COMPLETED
        agent_state.completed_at = datetime.now().isoformat()
        active_agents[agent_id] = agent_state

        await broadcast({
            "type": "agent_completed",
            "agent_id": agent_id,
        })

    except Exception as exc:
        agent_state.status = AgentStatus.ERROR
        agent_state.error = str(exc)
        active_agents[agent_id] = agent_state

        await broadcast({
            "type": "agent_error",
            "agent_id": agent_id,
            "error": str(exc),
        })


def _extract_web_result(block) -> str:
    """Extract a readable snippet from web_search_tool_result block."""
    try:
        content = getattr(block, "content", [])
        if isinstance(content, list):
            for item in content[:3]:
                title = getattr(item, "title", "")
                url = getattr(item, "url", "")
                snippet = getattr(item, "page_snippet", "") or getattr(item, "snippet", "")
                if title or snippet:
                    return f"[{title}] {snippet[:200]}"
        return "(search completed)"
    except Exception:
        return "(search completed)"
