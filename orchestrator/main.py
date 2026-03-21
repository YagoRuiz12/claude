import asyncio
import json
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from .config import load_config
from .models import AgentState, AgentStatus, SystemConfig, TaskRequest
from .runner import run_agent_task

# ──────────────────────────────────────────────
# Global state
# ──────────────────────────────────────────────
connected_clients: list[WebSocket] = []
active_agents: dict[str, AgentState] = {}
system_config: SystemConfig | None = None


async def broadcast(event: dict) -> None:
    dead = []
    for ws in connected_clients:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connected_clients.remove(ws)


# ──────────────────────────────────────────────
# App lifecycle
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global system_config
    config_path = os.environ.get("AGENT_CONFIG", "configs/demo.yaml")
    system_config = load_config(config_path)
    print(f"✓ Loaded config: {system_config.name}")
    print(f"  Agents: {[a.name for a in system_config.agents]}")
    yield


app = FastAPI(title="Agent Control Center", lifespan=lifespan)

# Serve dashboard static files
_dashboard = Path(__file__).parent.parent / "dashboard"
app.mount("/static", StaticFiles(directory=str(_dashboard)), name="static")


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────
@app.get("/", response_class=HTMLResponse)
async def serve_dashboard():
    return (_dashboard / "index.html").read_text()


@app.get("/api/config")
async def get_config():
    if not system_config:
        raise HTTPException(500, "Config not loaded")
    return system_config.model_dump()


@app.get("/api/agents")
async def list_agents():
    return list(active_agents.values())


@app.post("/api/tasks")
async def create_task(task: TaskRequest):
    if not system_config:
        raise HTTPException(500, "Config not loaded")

    # Resolve which agent config to use
    agent_cfg = None
    if task.agent_name:
        agent_cfg = next((a for a in system_config.agents if a.name == task.agent_name), None)
    if not agent_cfg and system_config.agents:
        agent_cfg = system_config.agents[0]
    if not agent_cfg:
        raise HTTPException(400, "No agents configured")

    agent_id = uuid.uuid4().hex[:8]
    state = AgentState(
        id=agent_id,
        name=agent_cfg.name,
        task=task.prompt,
        status=AgentStatus.RUNNING,
        started_at=datetime.now().isoformat(),
        color=agent_cfg.color,
    )
    active_agents[agent_id] = state

    await broadcast({"type": "agent_started", "agent": state.model_dump()})

    asyncio.create_task(
        run_agent_task(agent_id, state, agent_cfg, system_config, broadcast, active_agents)
    )

    return {"agent_id": agent_id}


@app.delete("/api/agents/{agent_id}")
async def stop_agent(agent_id: str):
    if agent_id not in active_agents:
        raise HTTPException(404, "Agent not found")
    active_agents[agent_id].status = AgentStatus.STOPPED
    await broadcast({"type": "agent_stopped", "agent_id": agent_id})
    return {"status": "stopped"}


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    connected_clients.append(ws)

    # Send current state to new client
    await ws.send_json({
        "type": "init",
        "agents": [a.model_dump() for a in active_agents.values()],
        "config": system_config.model_dump() if system_config else {},
    })

    try:
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await ws.send_json({"type": "pong"})
    except WebSocketDisconnect:
        if ws in connected_clients:
            connected_clients.remove(ws)
