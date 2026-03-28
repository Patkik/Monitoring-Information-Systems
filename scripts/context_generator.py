"""
Production Context Folder Generator

Creates templatable, production-ready context folders with:
- Execution state catalogs
- Architecture references
- Metadata manifests
- Session tracking
- File integrity hashes
- Searchable catalogs

Structure:
context/
  ├── state.json                    # Current execution state
  ├── architecture_reference.json   # System architecture
  ├── file_catalog.json            # All files in project
  ├── metadata.json                # Project metadata
  ├── sessions/                    # Session history
  │   └── session_000.json
  ├── templates/                   # Reusable templates
  │   ├── instruction_template.md
  │   ├── agent_template.md
  │   └── skill_template.md
  └── validation/                  # Integrity checks
      └── checksums.json
"""

from __future__ import annotations

import json
import hashlib
from pathlib import Path
from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, Any


@dataclass
class ExecutionState:
    """Current execution state"""
    status: str = "initialized"  # initialized | in_progress | completed | error
    current_pipeline: str = "Orchestrator"
    last_status: str = "Project setup initiated"
    agents: list[str] = field(default_factory=list)
    session_id: str = ""
    timestamp: str = ""
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ArchitectureReference:
    """System architecture summary"""
    name: str = "Orchestrator Framework"
    version: str = "1.0.0"
    description: str = "Multi-agent SaaS orchestration framework"
    components: dict[str, str] = field(default_factory=dict)
    layers: dict[str, str] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class ProjectMetadata:
    """Project-level metadata"""
    name: str = "Orchestrator"
    author: str = "Patrick Josh Añedez"
    license: str = "MIT"
    version: str = "1.0.0"
    description: str = "Enterprise multi-agent orchestration framework"
    keywords: list[str] = field(default_factory=list)
    repository: str = "https://github.com/its-patri/Orchestrator"
    
    def to_dict(self) -> dict:
        return asdict(self)


class ContextGenerator:
    """Generate production-ready context folder"""
    
    def __init__(self, target_dir: Path):
        self.target_dir = target_dir.resolve()
        self.context_dir = self.target_dir / "context"
    
    def create_directory_structure(self) -> bool:
        """Create context folder structure"""
        print("📁 Creating context directory structure...")
        
        try:
            (self.context_dir / "sessions").mkdir(parents=True, exist_ok=True)
            (self.context_dir / "templates").mkdir(parents=True, exist_ok=True)
            (self.context_dir / "validation").mkdir(parents=True, exist_ok=True)
            print("  ✅ Directory structure created")
            return True
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            return False
    
    def generate_state_json(self) -> Path:
        """Generate execution state file"""
        print("📊 Generating execution state...")
        
        state = ExecutionState(
            session_id=f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            timestamp=datetime.now().isoformat(),
            agents=["orchestrator", "coder", "reviewer", "researcher", "logic-debugger"],
        )
        
        state_path = self.context_dir / "state.json"
        with open(state_path, "w") as f:
            json.dump(state.to_dict(), f, indent=2)
        
        print(f"  ✅ {state_path}")
        return state_path
    
    def generate_architecture_reference(self) -> Path:
        """Generate architecture reference"""
        print("🏗️  Generating architecture reference...")
        
        arch = ArchitectureReference(
            components={
                "orchestrator": "Core agent dispatcher and state management",
                "coder": "Python/JS code generation and testing",
                "reviewer": "Code quality and security validation",
                "researcher": "Documentation and context gathering",
                "logic_debugger": "Error diagnosis and trace analysis",
            },
            layers={
                "presentation": "CLI and UI interfaces",
                "business": "Agent orchestration and routing",
                "persistence": "SQLite state management",
                "integration": "File I/O and external APIs",
            }
        )
        
        arch_path = self.context_dir / "architecture_reference.json"
        with open(arch_path, "w") as f:
            json.dump(arch.to_dict(), f, indent=2)
        
        print(f"  ✅ {arch_path}")
        return arch_path
    
    def generate_metadata(self) -> Path:
        """Generate project metadata"""
        print("📋 Generating project metadata...")
        
        metadata = ProjectMetadata(
            keywords=[
                "multi-agent",
                "orchestration",
                "saas",
                "python",
                "nodejs",
                "cli",
                "automation",
            ]
        )
        
        metadata_path = self.context_dir / "metadata.json"
        with open(metadata_path, "w") as f:
            json.dump(metadata.to_dict(), f, indent=2)
        
        print(f"  ✅ {metadata_path}")
        return metadata_path
    
    def generate_instruction_template(self) -> Path:
        """Generate instruction file template"""
        print("📝 Generating templates...")
        
        template = '''---
description: "Brief description of what this instruction does"
applyTo: "**/*.{py,js}"
---

# Agent Instruction Template

## 1. Purpose
Describe the primary purpose and goal of this instruction.

## 2. Key Rules
- Rule 1: Description
- Rule 2: Description
- Rule 3: Description

## 3. Implementation Requirements
List specific implementation constraints and requirements.

## 4. Validation Checklist
- [ ] Meets all requirements
- [ ] Properly documented
- [ ] Tested successfully
- [ ] Approved by reviewer

## 5. References
- Link to related documentation
- Link to code examples
- Link to related instructions
'''
        
        template_path = self.context_dir / "templates" / "instruction_template.md"
        with open(template_path, "w") as f:
            f.write(template)
        
        print(f"  ✅ Instruction template")
        return template_path
    
    def generate_agent_template(self) -> Path:
        """Generate agent definition template"""
        template = '''---
description: "Agent purpose and primary domain"
triggers:
  - trigger_keyword_1
  - trigger_keyword_2
role: "Agent role description"
---

# Agent: AgentName

## Purpose
Describe what this agent does and when it should be invoked.

## Capabilities
- Capability 1: Description
- Capability 2: Description
- Capability 3: Description

## Input Requirements
- input_1: Description
- input_2: Description

## Output Format
Describe the structured output this agent produces.

## Integration Points
- Integration 1: How it connects to other agents
- Integration 2: How it connects to tools

## Error Handling
Describe how this agent handles and recovers from errors.

## Examples
### Example 1
Input: ...
Output: ...

### Example 2
Input: ...
Output: ...

## YAML Configuration
```yaml
name: agent-name
role: specific_role
triggers:
  - keyword1
  - keyword2
dependencies:
  - other_agent
```
'''
        
        template_path = self.context_dir / "templates" / "agent_template.md"
        with open(template_path, "w") as f:
            f.write(template)
        
        print(f"  ✅ Agent template")
        return template_path
    
    def generate_skill_template(self) -> Path:
        """Generate skill template"""
        template = '''# Skill: SkillName

**Description:** Brief description of the skill

**Triggers:** When should this skill be used?

**Domain:** Primary domain of expertise

## When to Use
- Use case 1
- Use case 2
- Use case 3

## Key Features
1. Feature 1: Description
2. Feature 2: Description
3. Feature 3: Description

## Implementation Pattern
```python
# Pseudo-code showing how to implement this skill
def skill_function(input_data):
    # Step 1
    # Step 2
    # Step 3
    return output
```

## API Reference
### Method 1
- Purpose: What it does
- Parameters: What it takes
- Returns: What it produces

### Method 2
- Purpose: What it does
- Parameters: What it takes
- Returns: What it produces

## Error Handling
Describe potential errors and recovery strategies.

## Performance Constraints
- Performance requirement 1
- Performance requirement 2

## Examples
### Example 1
Input: ...
Output: ...

## Related Skills
- Skill 1: How it relates
- Skill 2: How it relates
'''
        
        template_path = self.context_dir / "templates" / "skill_template.md"
        with open(template_path, "w") as f:
            f.write(template)
        
        print(f"  ✅ Skill template")
        return template_path
    
    def generate_session_log(self) -> Path:
        """Generate empty session log"""
        print("📝 Generating session log...")
        
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        session = {
            "id": session_id,
            "created": datetime.now().isoformat(),
            "events": [],
            "status": "active",
        }
        
        session_path = self.context_dir / "sessions" / f"{session_id}.json"
        with open(session_path, "w") as f:
            json.dump(session, f, indent=2)
        
        print(f"  ✅ {session_path}")
        return session_path
    
    def generate_checksums_file(self) -> Path:
        """Generate file integrity checksum catalog"""
        print("🔐 Generating integrity checksums...")
        
        checksums = {
            "generated": datetime.now().isoformat(),
            "files": {},
        }
        
        # Scan all files in context directory
        for file_path in self.context_dir.rglob("*"):
            if file_path.is_file():
                try:
                    with open(file_path, "rb") as f:
                        file_hash = hashlib.sha256(f.read()).hexdigest()
                    
                    relative_path = str(file_path.relative_to(self.context_dir))
                    checksums["files"][relative_path] = file_hash
                except Exception:
                    pass
        
        checksums_path = self.context_dir / "validation" / "checksums.json"
        with open(checksums_path, "w") as f:
            json.dump(checksums, f, indent=2)
        
        print(f"  ✅ {len(checksums['files'])} files tracked")
        return checksums_path
    
    def generate_readme(self) -> Path:
        """Generate context folder README"""
        print("📖 Generating context folder README...")
        
        readme = '''# Context Folder

This folder contains production-ready context and configuration for the Orchestrator Framework.

## Structure

### Core Files
- **state.json** - Current execution state and session tracking
- **metadata.json** - Project metadata and configuration
- **architecture_reference.json** - System architecture overview

### Sessions
- **sessions/** - Session history and logs
  - Each session is tracked in session_TIMESTAMP.json format

### Templates
- **templates/** - Reusable markdown templates
  - instruction_template.md - Template for instruction files
  - agent_template.md - Template for agent definitions
  - skill_template.md - Template for skill implementations

### Validation
- **validation/checksums.json** - File integrity tracking
  - SHA256 hashes for audit trail
  - Used to detect unauthorized changes

## Usage

### Updating Execution State
Edit `state.json` to update the current pipeline status and agent states.

### Creating New Sessions
Copy a session template from `sessions/` and update the timestamp.

### Using Templates
1. Copy the appropriate template from `templates/`
2. Fill in the required sections
3. Place in the corresponding `.github/` directory
4. Run validation to confirm format

### Verifying Integrity
Run the validation script to check file checksums:
```bash
python scripts/production_extractor.py --validate-only --target .
```

## Best Practices

1. **Version Control**: Commit all context changes to git
2. **Backups**: Archive important sessions regularly
3. **Checksums**: Verify integrity after loading context
4. **Documentation**: Keep templates updated with latest patterns
5. **Catalog**: Regenerate catalogs when files change

## Integration

This context folder integrates with:
- Agent instructions (.github/instructions/)
- Agent definitions (.github/agents/)
- Skills library (.github/skills/)
- CI/CD workflows (.github/workflows/)

See `../documentation/` for full architecture details.
'''
        
        readme_path = self.context_dir / "README.md"
        with open(readme_path, "w") as f:
            f.write(readme)
        
        print(f"  ✅ {readme_path}")
        return readme_path
    
    def generate_all(self) -> dict:
        """Generate complete context folder"""
        print("\n🚀 PRODUCTION CONTEXT GENERATION")
        print("=" * 60)
        
        results = {
            "created": 0,
            "files": [],
            "errors": [],
        }
        
        try:
            # Create structure
            if not self.create_directory_structure():
                results["errors"].append("Failed to create directory structure")
                return results
            
            # Generate files
            files_to_create = [
                self.generate_state_json,
                self.generate_architecture_reference,
                self.generate_metadata,
                self.generate_instruction_template,
                self.generate_agent_template,
                self.generate_skill_template,
                self.generate_session_log,
                self.generate_checksums_file,
                self.generate_readme,
            ]
            
            for create_func in files_to_create:
                try:
                    path = create_func()
                    results["files"].append(str(path))
                    results["created"] += 1
                except Exception as e:
                    error_msg = f"{create_func.__name__}: {str(e)}"
                    results["errors"].append(error_msg)
                    print(f"  ❌ {error_msg}")
            
            print(f"\n✅ Context generation complete:")
            print(f"  - Created: {results['created']} files/folders")
            print(f"  - Location: {self.context_dir}")
            print(f"  - Size: {sum(p.stat().st_size for p in self.context_dir.rglob('*') if p.is_file())} bytes")
            
        except Exception as e:
            results["errors"].append(f"Fatal error: {str(e)}")
            print(f"\n❌ Fatal error: {e}")
        
        return results


def main(argv: list[str] | None = None) -> int:
    """CLI entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Production Context Generator",
    )
    parser.add_argument(
        "--target",
        default=".",
        help="Target directory for context generation",
    )
    
    args = parser.parse_args(argv)
    
    target = Path(args.target).resolve()
    generator = ContextGenerator(target)
    results = generator.generate_all()
    
    return 0 if not results["errors"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
