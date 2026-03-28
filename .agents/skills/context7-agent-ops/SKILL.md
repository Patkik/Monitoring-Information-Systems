---
name: context7-agent-ops
description: Use when applying Context7 documentation workflows to agent planning, tool selection, and implementation quality. Triggers on: context7, context 7, resolve-library-id, get-library-docs, library grounding, API signature validation, planning consistency, tool argument precision, evaluator optimizer checks.
---

# Context7 Agent Operations

Use this skill to make agent execution more reliable by grounding implementation decisions in up-to-date library docs via Context7.

## When To Use

- You are writing or editing code that depends on third-party libraries.
- You need to reduce planning mistakes caused by incorrect API assumptions.
- You want stronger evaluation signals than task pass rate.

## Core Workflow

1. Identify each external library touched by the task.
2. Resolve each library ID with `mcp_context7_resolve-library-id`.
3. Retrieve focused docs with `mcp_context7_get-library-docs` using a specific topic.
4. Produce an explicit action plan based on retrieved docs.
5. Execute changes.
6. Run evaluator checks against tool usage, reasoning quality, efficiency, and safety.

## Context7-First Rules

- Never assume API signatures from memory.
- Retrieve docs for every non-trivial library call.
- Prefer topic-scoped doc retrieval over broad retrieval.
- Record resolved library IDs used for the task.

## Planning Template

Use this plan shape before implementation:

- Goal: single-sentence desired outcome.
- Sub-goals: ordered list of atomic steps.
- Dependencies: libraries and APIs required.
- Context7 sources: resolved IDs and topics.
- Risk checks: auth, permissions, data integrity, regressions.
- Exit criteria: objective checks for done state.

## Evaluation Template

Score each category 0-2. Target total >= 8/10.

- Tool Selection Accuracy:
  - 0 wrong tool class
  - 1 mixed
  - 2 consistently correct
- Tool Argument Precision:
  - 0 frequent invalid args
  - 1 occasional fixes needed
  - 2 valid arguments on first pass
- Planning Consistency:
  - 0 ad-hoc actions
  - 1 partial plan adherence
  - 2 clear plan followed and adapted correctly
- Efficiency:
  - 0 many unnecessary steps
  - 1 moderate overhead
  - 2 concise step count and low rework
- Safety and Reliability:
  - 0 unsafe or breaking behavior
  - 1 minor risk exposure
  - 2 secure and stable behavior

## Example Context7 Query Set

- Resolve:
  - `mcp_context7_resolve-library-id("react")`
  - `mcp_context7_resolve-library-id("mongoose")`
- Fetch:
  - `mcp_context7_get-library-docs("/facebook/react", topic="hooks")`
  - `mcp_context7_get-library-docs("/mongoosejs/mongoose", topic="schema validation")`

## CMS-Focused Usage

In CMS V2 tasks, apply Context7 before changing:

- React component hooks and render behavior
- Mongoose schema or query behavior
- React Query and Zustand interaction patterns
- Any library-specific validation or middleware APIs

## Failure Recovery

If implementation fails:

1. Re-check the exact API signature in Context7.
2. Compare current code with doc example patterns.
3. Update plan and retry with narrowed scope.
4. Log root cause category: planning, tool usage, or integration mismatch.
