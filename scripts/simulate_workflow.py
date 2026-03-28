import json
import time
import random
from orchestrator.dispatcher import AgenticDispatcher

def run_simulation():
    dispatcher = AgenticDispatcher()
    data_record = []
    
    # 1. Setup Mock Handlers
    def mock_coder(payload):
        time.sleep(0.5) # Simulate API delay
        # Simulate reflection pass/fail based on critique presence
        critique = payload.get("critique")
        if not critique:
            return {
                "agent": "coder",
                "reflection_passed": False,
                "feedback": "Code is missing type hints and edge case handling.",
                "data": {"code": "def fast_math(a,b): return a+b"}
            }
        else:
            return {
                "agent": "coder",
                "reflection_passed": True,
                "feedback": "Code looks good now.",
                "data": {"code": "def fast_math(a: int, b: int) -> int:\n    return a + b"}
            }

    def mock_researcher(payload):
        time.sleep(0.2)
        topic = payload.get("topic", "General")
        return {
            "agent": "researcher",
            "reflection_passed": True,
            "data": f"Summary for {topic}: [Mock Data]"
        }

    def mock_reviewer(payload):
        time.sleep(0.3)
        return {
            "agent": "reviewer",
            "reflection_passed": True,
            "data": "100x Quality Review: APPROVED."
        }

    # Register Agents
    dispatcher.register_agent("Coder", ["code", "implement", "build"], mock_coder)
    dispatcher.register_agent("Researcher", ["research", "search", "docs"], mock_researcher)
    dispatcher.register_agent("Reviewer", ["review", "audit", "qa"], mock_reviewer)

    # 2. Simulate Parallelization
    print("Starting Parallelization Test...")
    start_time = time.time()
    parallel_tasks = [
        {"intent": "research latest python practices", "payload": {"topic": "python 3.12"}},
        {"intent": "docs for deployment", "payload": {"topic": "docker compose"}},
        {"intent": "review old architecture", "payload": {"code": "architect.py"}}
    ]
    parallel_results = dispatcher.execute_parallel(parallel_tasks)
    end_time = time.time()
    
    data_record.append({
        "phase": "Parallel Execution",
        "time_taken_seconds": round(end_time - start_time, 2),
        "tasks": len(parallel_tasks),
        "results": parallel_results
    })

    # 3. Simulate Reflection Loop (Self-Correction)
    print("Starting Reflection Test...")
    start_time = time.time()
    reflection_task = {
        "intent": "implement the fast math function", 
        "payload": {}
    }
    
    # We will wrap it in a mock watcher to catch attempts
    try:
        reflection_result = dispatcher.reflection_loop(reflection_task, max_retries=3)
        end_time = time.time()
        data_record.append({
            "phase": "Reflection Loop",
            "status": "Success",
            "time_taken_seconds": round(end_time - start_time, 2),
            "final_result": reflection_result
        })
    except Exception as e:
        end_time = time.time()
        data_record.append({
            "phase": "Reflection Loop",
            "status": "Failed",
            "time_taken_seconds": round(end_time - start_time, 2),
            "error": str(e)
        })

    # 4. Save the data record to a JSON file
    output_file = "simulation_data.json"
    with open(output_file, "w") as f:
        json.dump(data_record, f, indent=4)
        
    print(f"Simulation complete! Data recorded to {output_file}")
    print(json.dumps(data_record, indent=2))

if __name__ == "__main__":
    run_simulation()
