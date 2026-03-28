# ORCHESTRATOR FRAMEWORK 
### Comprehensive Architecture & Documentation

## 1. Overview
The Orchestrator system is a sophisticated **multi-agent coordination framework** designed to autonomously map high-level user intents into production-ready software. By decomposing goals, delegating tasks to specialized subagents, and enforcing rigorous quality gates deterministically, the Orchestrator achieves zero-hallucination tolerance and continuous execution.

Rooted in a "Socratic" and "Anti-Fragility" methodology, the Orchestrator refuses to guess. It leverages state management, continuous reflection, and automated debugging to iterate on code until it achieves mathematical certainty (99.9999999% perfection) before concluding a cycle.

---

## 2. Core Entities & Roles

The system is built upon a hierarchy of strictly bounded personas. No single agent possesses the ability to bypass the QA pipeline.

### The Master Orchestrator ("Supreme CEO")
- **File:** `.github/instructions/orchestrator.instructions.md`
- **Role:** Central dispatcher and state tracker.
- **Responsibilities:**
  - Breaks massive user requests into a sequential `manage_todo_list` pipeline.
  - Delegates atomic tasks to subagents via `runSubagent`.
  - Analyzes the structural tags (`<research_summary>`, `<implementation_report>`) passed between agents.
  - Dynamically appends debugging and testing steps to tasks if output is rejected.
- **Rule of Thumb:** *The Orchestrator never writes code directly; it only manages state and delegation.*

### Subagent: Context-Manager ("State Master")
- **File:** `.github/instructions/context-manager.instructions.md`
- **Role:** Handles the token economy and persistent memory.
- **Responsibilities:**
  - Aggressively compresses sprawling traces into bullet points.
  - Maintains global truth in `/memories/` (architecture rules, env behaviors).
  - Maintains session state in `/memories/session/`.
  - Exempt from strict QA gates to freely operate on state structures. Always returns payloads wrapped in `<context_state>`.

### Subagent: Logic-Debugger
- **File:** `.github/agents/logic-debugger.agent.md`
- **Role:** Deep analytical repair and static gatekeeping.
- **Responsibilities:**
  - Invoked automatically when code fails tests or the Coder hallucinates.
  - Uses trace-driven root-cause isolation rather than blind recursive guessing.
  - Enforces the "Historic Lesson Learning" rule: documents failed patches to avoid regression loops.
  - Passes its fix back to the pipeline, triggering a mandated automated test verification by the Orchestrator.

### Subagent: 100x Code Reviewer
- **File:** `.github/agents/reviewer.agent.md`
- **Role:** The ultimate codebase QA. 
- **Responsibilities:**
  - Audits code for critical security vulnerabilities, N+1 query problems, and architectural compatibility across the stack.
  - Acts as a gatekeeper. If the reviewer emits a `<review_verdict>REJECTED</review_verdict>`, the Orchestrator triggers the Logic-Debugger again.

---

## 3. The Hook Engine (Policy Enforcement)

The Orchestrator derives its determinism from a series of Python script hooks triggered at specific agent lifecycle events (defined in `.github/hooks/orchestrator-automation.json`). 

### Current Hook Registry Version
- `orchestrator-automation.json` version: `1.2.0`
- schemaVersion: `1`

### `PostTaskCompletion` Hooks
Fired after task completion for lifecycle-level quality checks.

### `SubagentStart` Hooks
Fired when a new agent is invoked, injecting strict boundary policies:
- **`orchestrator_policy.py`**: Ensures Coders focus on testable logic, Researchers stick to factual retrieval, and the Orchestrator avoids manual labor.

### `PreToolUse` Hooks
Fired right before a tool is executed to prevent runaway context and enforce rules:
- **`pre_tool_policy.py`**: Intercepts delegative tools to remind the Orchestrator to provide crisp task boundaries.
- **`context_manager_hook.py`**: Enforces strict aggressive compression and formatting logic for context saves.
- **`qa_todo_enforcement.py`**: If issues are detected, forcibly halts finalization, demanding the Orchestrator inject debugging tasks into the todo list and trigger a testing mandate.
- **`error_recovery_policy.py`**: Detects transient API/Stream failures and applies an autonomous exponentially-backed-off retry loop, preventing structural collapse over network blips.
- **`socratic_continuation_hook.py`**: Detects keywords like "proceed" or "continue." If a task was arbitrarily truncated, it triggers a continuous reflection loop, forcing the Context-Manager to summarize states and the Orchestrator to reassess missing pieces.

### `PostToolUse` Hooks
Fired after a tool is executed to enforce completion quality requirements:
- **`continual_learning_checkpoint.py`**: Validates `task_complete` events and requires continual-learning checkpoint language in summaries. The validator accepts summaries that include at least one of these keywords: `lesson`, `learned`, `prevention`, `retrospective`, `runbook`, `checklist`.
- **Location:** Rule file is `.github/hooks/orchestrator-automation.json`; script file is `.github/hooks/scripts/continual_learning_checkpoint.py`.
- **Trigger Rule:** `PostToolUse` handler with `when.tool = task_complete` and `failMode = warn`.

---

## 4. The "Socratic Vibecoding" Loop

Standard AI generation stops when a context window is maxed or arbitrary length is hit. The Orchestrator leverages the **"Socrates of Vibecoding Protocol"** (`.github/instructions/socrates-vibecoding.instructions.md`).

1. **Detection:** When incomplete work is recognized (via user prompt or hook).
2. **Reflection:** The Context-Manager records exactly what decisions were made and what results were definitively achieved (stored in `context/state.json`).
3. **Execution Pipeline:**
   - Goal Decomposed $\rightarrow$ `manage_todo_list` updated.
   - Coder writes logic.
   - Test-Automation verifies math/logic.
   - Logic-Debugger loops over failures.
   - 100x Reviewer verifies architecture.
4. **Conclusion:** State is updated and persisted; pipeline clears for the next directive.

---

## 5. Persistence and File Boundaries

- **Configuration:** All behaviors, hooks, and instructions live exclusively within the `.github/` boundary of the workspace.
- **State Tracking:** Current execution loops and decisions are strictly externalized to `context/state.json`. 
- **Memory Generation:** Learned project rules and workflows are continually pushed to `/memories/repo/` by the Context-Manager to serve future sessions.
- **The Orchestrator Folder:** The separate workspace directory (`c:\Users\patri\OneDrive\Desktop\Holy folder\Orchestrator`) serves as the dedicated staging ground and artifact repository for output generation entirely separate from internal execution hooks.

---

## 6. Anti-Patterns to Avoid
1. **Never merge subagent tasks**: Each subagent gets a singular, discrete directive.
2. **Never swallow errors**: If a test fails, the Logic-Debugger receives the raw trace before adjusting code.
3. **Never allow blind retries**: API failures trigger backoffs; logical failures trigger re-planning and code mutation testing.
4. **Never rely on ephemeral context**: If a decision matters, it must traverse through the Context-Manager into persistent `.json` or `.md` memory files.