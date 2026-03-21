#!/usr/bin/env python3
"""Entry point for the Agent Control Center."""
import os
import sys


def check_requirements():
    missing = []
    try:
        import anthropic  # noqa
    except ImportError:
        missing.append("anthropic")
    try:
        import fastapi  # noqa
    except ImportError:
        missing.append("fastapi")
    try:
        import uvicorn  # noqa
    except ImportError:
        missing.append("uvicorn[standard]")
    try:
        import yaml  # noqa
    except ImportError:
        missing.append("pyyaml")

    if missing:
        print(f"[!] Missing packages: {', '.join(missing)}")
        print(f"    Run: pip install {' '.join(missing)}")
        sys.exit(1)

    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("[!] ANTHROPIC_API_KEY is not set.")
        print("    Export it before running: export ANTHROPIC_API_KEY=sk-ant-...")
        sys.exit(1)


if __name__ == "__main__":
    check_requirements()

    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    config = os.environ.get("AGENT_CONFIG", "configs/demo.yaml")

    print(f"\n🤖 Agent Control Center")
    print(f"   Config : {config}")
    print(f"   URL    : http://localhost:{port}")
    print(f"   Ctrl+C to stop\n")

    uvicorn.run(
        "orchestrator.main:app",
        host=host,
        port=port,
        reload=False,
        log_level="warning",
    )
