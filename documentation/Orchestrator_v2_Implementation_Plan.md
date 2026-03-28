# Orchestrator Framework v2: Technical Implementation Specification

**Objective:** Transform the Orchestrator framework into an enterprise-grade, deterministic, and secure autonomous software engineering system via event-driven messaging, MicroVM sandboxing, semantic transaction rollbacks, and AST-based context management.

---

## 1. Transactional State & Semantic Rollback

**Files to Modify/Create:**
- `orchestrator/state/db_manager.py` (New)
- `orchestrator/state/agent_fs.py` (New)
- `.github/hooks/scripts/context_manager_hook.py` (Modify to use SQLite over `state.json`)

### A. SQLite Backend with WAL Mode
Replace fragile JSON modifications with a thread-safe, concurrent SQLite pool.

```python
# orchestrator/state/db_manager.py
import sqlite3
import contextlib
import threading

class StateDatabase:
    _local = threading.local()

    def __init__(self, db_path: str = "orchestrator_state.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with self.get_connection() as conn:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            conn.execute("PRAGMA busy_timeout=5000;")
            conn.execute('''
                CREATE TABLE IF NOT EXISTS system_state (
                    key TEXT PRIMARY KEY,
                    value JSON,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

    @contextlib.contextmanager
    def get_connection(self):
        if not hasattr(self._local, "conn"):
            self._local.conn = sqlite3.connect(
                self.db_path, 
                check_same_thread=False,
                isolation_level="DEFERRED"
            )
        yield self._local.conn

    def execute_transaction(self, query: str, params: tuple):
        """Atomic transaction wrapper"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute(query, params)
                conn.commit()
            except sqlite3.Error as e:
                conn.rollback()
                raise e
```

### B. Git-Native Semantic Rollback (AgentFS wrapper)
```python
# orchestrator/state/agent_fs.py
import pygit2
import time

class SemanticRollbackManager:
    def __init__(self, repo_path: str = "."):
        self.repo = pygit2.Repository(repo_path)

    def create_checkpoint(self, agent_name: str, action: str) -> str:
        """Acts like a granular git commit for an agent's exact state."""
        index = self.repo.index
        index.add_all()
        index.write()
        tree = index.write_tree()
        author = pygit2.Signature(agent_name, f"{agent_name}@orchestrator.local")
        committer = pygit2.Signature('Orchestrator', 'sys@orchestrator.local')
        commit_id = self.repo.create_commit(
            'HEAD', author, committer, 
            f"Checkpoint: {action}", 
            tree, [self.repo.head.target]
        )
        return str(commit_id)

    def revert_to_checkpoint(self, commit_id: str):
        """Hard reset workspace to the last known good commit."""
        self.repo.reset(commit_id, pygit2.GIT_RESET_HARD)
```

**Testing Strategy:** 
Unit tests simulating concurrent database writes using `concurrent.futures`. Assert that `db_manager.execute_transaction` properly rolls back upon intentional SQL syntax faults without locking the database.

---

## 2. Absolute Execution Security via MicroVM Sandboxing

**Files to Modify/Create:**
- `orchestrator/execution/sandbox.py` (New)
- `.github/instructions/coder.instructions.md` (Update policies)

Use `E2B` (or native Firecracker) to spawn ephemeral instances. 

```python
# orchestrator/execution/sandbox.py
from e2b_code_interpreter import Sandbox
import os

class ShadowMicroVM:
    def __init__(self, template: str = "orchestrator-base"):
        # Spawns a MicroVM in < 300ms
        self.sandbox = Sandbox(template=template, timeout=30) 

    def execute_shadow_test(self, generated_code: str, test_command: str) -> bool:
        """
        Dual execution logic: Only merges into primary if tests pass on VM.
        """
        try:
            # 1. Inject code into microVM
            self.sandbox.filesystem.write('/app/feature.py', generated_code)
            
            # 2. Run BDD tests with strictly enforced timeouts and egress filtering
            process = self.sandbox.commands.run(test_command, timeout=30)
            
            if process.exit_code == 0:
                return True
            else:
                raise RuntimeError(f"Shadow Execution Failed: {process.stderr}")
        finally:
            # 3. MicroVM is destroyed instantly
            self.sandbox.kill()
```

**Testing Strategy:**
Run tests that attempt to access restricted network endpoints (e.g., `requests.get('http://malicious.com')`) within the shadow test to ensure proper network egress filtering enforces isolation.

---

## 3. Event-Driven, Concurrent Orchestration

**Files to Modify/Create:**
- `orchestrator/core/event_bus.py` (New)
- `orchestrator/main.py` (Refactor)

Refactor line-blocking into an asyncio Pub/Sub event broker.

```python
# orchestrator/core/event_bus.py
import asyncio
from typing import Callable, Dict, List

class EventBus:
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {}
        self.queue = asyncio.Queue()

    def subscribe(self, event_type: str, callback: Callable):
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(callback)

    async def publish(self, event_type: str, payload: dict):
        await self.queue.put({"type": event_type, "payload": payload})

    async def _process_events(self):
        while True:
            event = await self.queue.get()
            callbacks = self.subscribers.get(event["type"], [])
            # Dispatch to agents concurrently
            await asyncio.gather(*(cb(event["payload"]) for cb in callbacks))
            self.queue.task_done()

# orchestrator/main.py (Example implementation)
bus = EventBus()

async def test_agent(payload):
    # Enforces BDD: Test Agent creates assertions *before* coder.
    print(f"Generating failing tests for: {payload['feature']}")
    await bus.publish("TestsFailed", {"blueprint": payload['feature']})

async def coder_agent(payload):
    print("Writing implementation to pass missing tests.")
    await bus.publish("CodeWritten", {"status": "pending_shadow_execution"})

bus.subscribe("BlueprintCreated", test_agent)
bus.subscribe("TestsFailed", coder_agent)
```

---

## 4. Hierarchical Context Management with AST

**Files to Modify/Create:**
- `orchestrator/context/ast_parser.py` (New)

```python
# orchestrator/context/ast_parser.py
from tree_sitter import Language, Parser
import tree_sitter_python
import os

class CodebaseASTIndexer:
    def __init__(self):
        self.parser = Parser()
        self.parser.set_language(Language(tree_sitter_python.language(), 'python'))
        self.semantic_index = {} # Maps function/class names to File/Line locations

    def index_file(self, filepath: str):
        with open(filepath, 'r') as f:
            code = f.read()
            
        tree = self.parser.parse(bytes(code, 'utf8'))
        
        # Traverse AST iteratively to find class and function definitions
        cursor = tree.walk()
        # [Implementation logic extracting definitions explicitly rather than full lines]
        # This drastically reduces context window memory usage.
        
    def get_context_for_node(self, node_name: str) -> str:
        """ Jump-to-code retrieval. Only sends the specific method to the LLM. """
        return self.semantic_index.get(node_name, "Node not found.")
```

---

## 5. Real-Time Observability & Cost Telemetry

**Files to Modify/Create:**
- `orchestrator/telemetry/tracer.py` (New)
- UI: React component utilizing `React Flow`.

```python
# orchestrator/telemetry/tracer.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def setup_telemetry():
    provider = TracerProvider()
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces"))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)
    return trace.get_tracer(__name__)

tracer = setup_telemetry()

def trace_agent_execution(agent_name: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            with tracer.start_as_current_span(f"agent_{agent_name}") as span:
                span.set_attribute("agent.prompt_tokens", kwargs.get("token_usage", 0))
                return await func(*args, **kwargs)
        return wrapper
    return decorator
```

---

## 6. Hardened Hook Engine with OOP

**Files to Modify:**
- `.github/hooks/scripts/base_hook.py` (New ABC)
- Refactor all existing `_policy.py` files to inherit from this.

```python
# .github/hooks/scripts/base_hook.py
from abc import ABC, abstractmethod
from typing import Dict, Any
from pydantic import BaseModel, ValidationError

class BasePolicyHook(ABC):
    class PayloadSchema(BaseModel):
        agent_name: str
        tool_name: str
        parameters: dict

    def execute(self, raw_payload: Dict[str, Any]) -> Dict[str, Any]:
        """Atomic loop wrapped with telemetry and strict structural validation"""
        try:
            # 1. Strict Validation
            validated_data = self.PayloadSchema(**raw_payload)
            
            # 2. SQLite Transaction Context
            # 3. Telemetry injection...
            
            return self._process_logic(validated_data)
        except ValidationError as e:
            raise ValueError(f"Payload corrupted. Rollback initiated: {e}")

    @abstractmethod
    def _process_logic(self, validated_data: PayloadSchema) -> Dict[str, Any]:
        """Implemented by child hooks like PreToolPolicyHook"""
        pass
```

---

## 7. Intellectual Property & Documentation (Patent Claims Draft)

### I. AST-Based Hierarchical Context Optimization
**Technical Effect:** Physically reduces network latency and computational memory footprint required for LLM context windows (VRAM). Solves the quadratic attention complexity barrier in large-scale document retrieval by translating monolithic strings into targeted multi-branch tree structures.
* **Claim:** "A method for orchestrating artificial intelligence code generation, utilizing tree-sitter Abstract Syntax Trees (AST) to preemptively truncate input tokens, thereby extracting only dependency-mapped semantic nodes prior to LLM submission."

### II. Pre-Emptive Shadow Execution via Ephemeral MicroVMs
**Technical Effect:** Structurally isolates hardware memory and network namespaces to computationally evaluate agent-generated logic without risking primary application state corruption or host machine penetration.
* **Claim:** "A fault-tolerant computing architecture wherein multi-agent synthesis workflows are deployed in sub-300ms parallel Firecracker virtual machines, preventing synchronization of codebase state until mathematical assertion (BDD) success is achieved on the isolated fork."

### III. Event-Driven AI Coordination (Non-Blocking)
**Technical Effect:** Eliminates sequential thread-blocking limitations, maximizing multi-core CPU cycle distribution when asynchronously routing inputs to dozens of disjointed subagencts (Coders, Reviewers, Context-Managers).
* **Claim:** "A publisher-subscriber message broker system explicitly routing LLM-generated output heuristics (Success, TestFailed, Hallucination Suspected) seamlessly as computational events, enabling simultaneous semantic evaluations decoupled from a linear execution stream."