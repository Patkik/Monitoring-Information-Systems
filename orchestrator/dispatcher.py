"""
dispatcher.py
Implements Agentic Design Patterns:
- Routing (Dynamic intent-based agent selection)
- Parallelization (Scatter-gather asynchronous execution)
- Reflection (Critic self-evaluation loops)
"""
import copy
import time
import re
import concurrent.futures
from typing import List, Dict, Any, Callable, TypedDict
from dataclasses import dataclass

class ReflectionOutput(TypedDict, total=False):
    reflection_passed: bool
    feedback: str
    status: str
    data: Any

@dataclass
class AgentMetadata:
    name: str
    capabilities: set
    handler: Callable[[Dict[str, Any]], Dict[str, Any]]

class AgenticDispatcher:
    def __init__(self):
        self.agent_registry: Dict[str, AgentMetadata] = {}
        # Reverse index for O(1) capability lookup
        self._capability_index: Dict[str, AgentMetadata] = {}

    def register_agent(self, name: str, capabilities: List[str], handler: Callable[[Dict[str, Any]], Dict[str, Any]]):
        meta = AgentMetadata(name=name, capabilities=set(capabilities), handler=handler)
        self.agent_registry[name] = meta
        for cap in capabilities:
            self._capability_index[cap.lower()] = meta

    def route_task(self, intent: str, payload: Dict[str, Any]) -> Any:
        """Dynamic routing based on exact token matching of capabilities."""
        # Find exact word matches in the intent to the capabilities
        words = set(re.findall(r'\w+', intent.lower()))
        for word in words:
            if word in self._capability_index:
                return self._capability_index[word].handler(payload)
                
        raise ValueError(f"No suitable agent found for intent: {intent}")

    def execute_parallel(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Scatter independent tasks and preserve order while handling exceptions."""
        results: List[Any] = [None] * len(tasks)
        with concurrent.futures.ThreadPoolExecutor() as executor:
            future_to_index = {
                executor.submit(self.route_task, task["intent"], task["payload"]): i
                for i, task in enumerate(tasks)
            }
            for future in concurrent.futures.as_completed(future_to_index):
                index = future_to_index[future]
                try:
                    results[index] = future.result()
                except Exception as e:
                    results[index] = {"error": str(e), "reflection_passed": False}
        return results

    def reflection_loop(self, task: Dict[str, Any], max_retries: int = 3) -> Any:
        """Critic loop: Forces the agent to evaluate its output before handoff."""
        attempt = 0
        working_task = copy.deepcopy(task)
        
        while attempt < max_retries:
            try:
                result = self.route_task(working_task["intent"], working_task["payload"])
                if result.get("reflection_passed", False):
                    return result
                    
                working_task["payload"]["critique"] = result.get("feedback", "Reflection failed without feedback.")
            except Exception as e:
                working_task["payload"]["critique"] = f"Execution error: {str(e)}"
                
            attempt += 1
            if attempt < max_retries:
                time.sleep(1) # Simple backoff to respect potential API rate limits
                
        raise RuntimeError(f"Agent failed to pass reflection within {max_retries} retries.")
