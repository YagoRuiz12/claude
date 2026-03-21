import yaml
from pathlib import Path
from .models import SystemConfig, AgentConfig


DEFAULT_CONFIG = SystemConfig(
    name="Agent Control Center",
    description="Multi-agent platform",
    agents=[
        AgentConfig(
            name="Research Agent",
            description="Searches the web and summarizes information",
            tools=["web_search", "web_fetch"],
            system_prompt="You are a research assistant. Search the web and provide clear, concise answers.",
            color="#3b82f6",
        ),
        AgentConfig(
            name="Analyst Agent",
            description="Analyzes data and writes code",
            tools=["code_execution"],
            system_prompt="You are a data analyst. Write and execute Python code to analyze data and solve problems.",
            color="#8b5cf6",
        ),
    ],
)


def load_config(path: str) -> SystemConfig:
    config_path = Path(path)
    if not config_path.exists():
        print(f"[config] File '{path}' not found, using default config.")
        return DEFAULT_CONFIG

    with open(config_path) as f:
        data = yaml.safe_load(f)

    agents = []
    for a in data.get("agents", []):
        agents.append(AgentConfig(**a))

    return SystemConfig(
        name=data.get("name", "Agent Control Center"),
        description=data.get("description", ""),
        model=data.get("model", "claude-opus-4-6"),
        global_system_prompt=data.get("global_system_prompt", ""),
        agents=agents,
    )
