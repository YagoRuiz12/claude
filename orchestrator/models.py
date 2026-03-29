from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional, List


class AgentStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    ERROR = "error"
    STOPPED = "stopped"


class AgentToolConfig(BaseModel):
    name: str  # "web_search", "web_fetch", "code_execution"


class AgentConfig(BaseModel):
    name: str
    description: str = ""
    system_prompt: str = ""
    tools: List[str] = Field(default_factory=list)
    max_turns: int = 10
    color: str = "#3b82f6"  # For UI display


class SystemConfig(BaseModel):
    name: str
    description: str = ""
    model: str = "claude-opus-4-6"
    global_system_prompt: str = ""
    agents: List[AgentConfig] = Field(default_factory=list)


class AgentState(BaseModel):
    id: str
    name: str
    task: str
    status: AgentStatus = AgentStatus.RUNNING
    started_at: str
    completed_at: Optional[str] = None
    error: Optional[str] = None
    turn: int = 0
    color: str = "#3b82f6"


class TaskRequest(BaseModel):
    prompt: str
    agent_name: Optional[str] = None
