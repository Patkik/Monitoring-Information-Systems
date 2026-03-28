# Continual-Learning Hook

## Purpose
This hook enforces a post-task continual-learning checkpoint so learned practices remain codified.

## Files
- Hook registry: `.github/hooks/orchestrator-automation.json`
- Hook script: `.github/hooks/scripts/continual_learning_checkpoint.py`
- Skill file checked: `.agents/skills/continual-learning/SKILL.md`
- Acknowledgement checked: `.github/copilot-instructions.md`

## Versioning
- Hook registry version: `1.2.0`
- Hook registry schemaVersion: `1`
- Fallback skill wrappers now include:
  - `version: 1.2.0`
  - `schema-version: 1`

## Behavior
On `PostToolUse` for `task_complete`, the hook script reads JSON payload from `stdin` and outputs JSON with:
- `allow`: `true` or `false`
- `status`: `ok` or `warn`
- `tool`
- `message`

The registry is configured in warn mode (`failMode: warn`) to avoid blocking normal execution while still surfacing drift.

For `task_complete`, summaries should include at least one checkpoint term:
- `lesson`
- `learned`
- `prevention`
- `retrospective`
- `runbook`
- `checklist`

## Manual Run
From repo root:

```powershell
echo '{"tool":"task_complete","arguments":{"summary":"Added lesson and runbook follow-up"}}' | python .github/hooks/scripts/continual_learning_checkpoint.py
```
