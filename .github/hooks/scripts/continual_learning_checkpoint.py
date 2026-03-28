#!/usr/bin/env python3
"""Post-tool hook for continual-learning checkpoint enforcement.

Expected stdin payload shape is flexible. The hook looks for:
- tool name (task_complete)
- summary text

If the tool is task_complete, summary must contain at least one keyword:
lesson, learned, prevention, retrospective, runbook, checklist
"""

from __future__ import annotations

import json
import sys
from typing import Any

KEYWORDS = (
    "lesson",
    "learned",
    "prevention",
    "retrospective",
    "runbook",
    "checklist",
)


def _read_payload() -> dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _tool_name(payload: dict[str, Any]) -> str:
    for key in ("tool", "toolName", "name"):
        value = payload.get(key)
        if isinstance(value, str) and value:
            return value

    event = payload.get("event")
    if isinstance(event, dict):
        for key in ("tool", "toolName", "name"):
            value = event.get(key)
            if isinstance(value, str) and value:
                return value
    return ""


def _summary_text(payload: dict[str, Any]) -> str:
    for key in ("summary", "message", "text"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()

    args = payload.get("arguments")
    if isinstance(args, dict):
        for key in ("summary", "message", "text"):
            value = args.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return ""


def _contains_checkpoint_terms(text: str) -> bool:
    lower = text.lower()
    return any(term in lower for term in KEYWORDS)


def main() -> int:
    payload = _read_payload()
    tool = _tool_name(payload)
    summary = _summary_text(payload)

    result: dict[str, Any] = {
        "hook": "continual-learning-checkpoint",
        "allow": True,
        "status": "ok",
        "message": "Hook skipped for non-task_complete tool.",
        "tool": tool,
    }

    if tool != "task_complete":
        print(json.dumps(result, ensure_ascii=True))
        return 0

    if not summary:
        result["allow"] = False
        result["status"] = "warn"
        result["message"] = (
            "task_complete summary missing; add continual-learning checkpoint language."
        )
        print(json.dumps(result, ensure_ascii=True))
        return 0

    if not _contains_checkpoint_terms(summary):
        result["allow"] = False
        result["status"] = "warn"
        result["message"] = (
            "Summary must include at least one continual-learning term: "
            "lesson, learned, prevention, retrospective, runbook, checklist."
        )
        print(json.dumps(result, ensure_ascii=True))
        return 0

    result["message"] = "Continual-learning checkpoint passed."
    print(json.dumps(result, ensure_ascii=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
