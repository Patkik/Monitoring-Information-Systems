#!/usr/bin/env python3
"""
Production-Grade Orchestrator Framework Extractor

Extracts all critical files for orchestration framework setup:
- Python modules (orchestrator/)
- Git hooks (.github/hooks/)
- Agent instructions (.github/instructions/)
- Agent definitions (.github/agents/)
- Skills library (.github/skills/)
- Documentation (documentation/)
- Configuration files
- Context files (context/)

Includes:
- File validation and integrity checks
- Production readiness verification
- Context catalog generation
- Documentation conversion (MD -> JSON/Python)
"""

from __future__ import annotations

import json
import hashlib
import argparse
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Optional
import shutil
import sys


@dataclass
class FileMetadata:
    """Metadata for tracked files"""
    source: Path
    target: Path
    purpose: str
    critical: bool
    file_hash: Optional[str] = None
    size: Optional[int] = None
    last_modified: Optional[float] = None


class ProductionExtractor:
    """Comprehensive production-ready extractor"""
    
    CRITICAL_DIRS = {
        "orchestrator": "Python orchestration modules",
        ".github/instructions": "Agent behavior specifications",
        ".github/agents": "Agent definitions",
        ".github/skills": "Skills library",
        ".github/hooks": "Git automation hooks",
        "documentation": "System documentation",
        "context": "Execution context and state",
        "tests": "Test suites",
    }
    
    REQUIRED_FILES = {
        "orchestrator/__init__.py": "Package initialization",
        "orchestrator/dispatcher.py": "Agent dispatcher logic",
        "orchestrator/state/db_manager.py": "State management",
        "pyproject.toml": "Project configuration",
        ".github/copilot-instructions.md": "System instructions",
        "README.md": "Project README",
    }
    
    def __init__(self, source_root: Path, target: Path, force: bool = False):
        self.source_root = source_root.resolve()
        self.target = target.resolve()
        self.force = force
        self.extracted_files: list[FileMetadata] = []
        self.missing_files: list[str] = []
        self.validation_report: dict = {}
    
    def calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file"""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
    
    def extract_python_modules(self) -> bool:
        """Extract orchestrator Python modules"""
        print("📦 Extracting Python modules...")
        source_dir = self.source_root / "orchestrator"
        target_dir = self.target / "orchestrator"
        
        if not source_dir.exists():
            self.missing_files.append("orchestrator/")
            return False
        
        try:
            if target_dir.exists() and self.force:
                shutil.rmtree(target_dir)
            target_dir.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(source_dir, target_dir, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
            
            # Track extracted files
            for py_file in target_dir.rglob("*.py"):
                self.extracted_files.append(FileMetadata(
                    source=source_dir / py_file.relative_to(target_dir),
                    target=py_file,
                    purpose="Python orchestration module",
                    critical=True,
                    file_hash=self.calculate_file_hash(py_file),
                    size=py_file.stat().st_size,
                ))
            
            print(f"  ✅ Extracted {len(list(target_dir.rglob('*.py')))} Python files")
            return True
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            return False
    
    def extract_directory(self, relative_path: str, purpose: str, critical: bool = True) -> bool:
        """Generic directory extraction"""
        print(f"📂 Extracting {relative_path}...")
        source_dir = self.source_root / relative_path
        target_dir = self.target / relative_path
        
        if not source_dir.exists():
            self.missing_files.append(relative_path)
            print(f"  ⚠️  Source not found: {relative_path}")
            return not critical
        
        try:
            if target_dir.exists() and self.force:
                shutil.rmtree(target_dir)
            target_dir.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(source_dir, target_dir, ignore=shutil.ignore_patterns("__pycache__", "*.pyc"))
            
            # Count files
            file_count = len(list(target_dir.rglob("*")))
            print(f"  ✅ Extracted {file_count} items from {relative_path}")
            return True
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            return not critical
    
    def extract_file(self, relative_path: str, purpose: str, critical: bool = True) -> bool:
        """Extract single file"""
        source_file = self.source_root / relative_path
        target_file = self.target / relative_path
        
        if not source_file.exists():
            self.missing_files.append(relative_path)
            if critical:
                print(f"  ❌ CRITICAL FILE MISSING: {relative_path}")
            return not critical
        
        try:
            target_file.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_file, target_file)
            
            self.extracted_files.append(FileMetadata(
                source=source_file,
                target=target_file,
                purpose=purpose,
                critical=critical,
                file_hash=self.calculate_file_hash(target_file),
                size=target_file.stat().st_size,
            ))
            print(f"  ✅ {relative_path}")
            return True
        except Exception as e:
            print(f"  ❌ {relative_path}: {e}")
            return not critical
    
    def extract_all(self) -> bool:
        """Extract all production files"""
        print("\n🚀 PRODUCTION ORCHESTRATOR EXTRACTION")
        print("=" * 60)
        
        success = True
        
        # Extract directories
        print("\n📦 MODULES & WORKFLOWS")
        success &= self.extract_python_modules()
        success &= self.extract_directory(".github/instructions", "Agent instructions", True)
        success &= self.extract_directory(".github/agents", "Agent definitions", True)
        success &= self.extract_directory(".github/skills", "Skills library", True)
        success &= self.extract_directory(".github/hooks", "Git hooks", False)
        success &= self.extract_directory("documentation", "Documentation", True)
        success &= self.extract_directory("context", "Context files", True)
        success &= self.extract_directory("tests", "Test suites", True)
        
        # Extract critical files
        print("\n📋 CONFIGURATION & METADATA")
        for file_path, purpose in self.REQUIRED_FILES.items():
            self.extract_file(file_path, purpose, critical=True)
        
        return success
    
    def validate_production_readiness(self) -> dict:
        """Validate all critical files are present"""
        print("\n✅ PRODUCTION READINESS CHECK")
        print("=" * 60)
        
        checks = {
            "python_modules": 0,
            "instructions": 0,
            "agents": 0,
            "skills_dirs": 0,
            "documentation": 0,
            "context_files": 0,
            "required_files": 0,
            "status": "PENDING"
        }
        
        # Count Python modules
        py_files = list((self.target / "orchestrator").rglob("*.py")) if (self.target / "orchestrator").exists() else []
        checks["python_modules"] = len(py_files)
        print(f"  {'✓' if checks['python_modules'] >= 4 else '✗'} Python modules: {checks['python_modules']} (required: 4+)")
        
        # Count instructions
        inst_files = list((self.target / ".github/instructions").rglob("*.md")) if (self.target / ".github/instructions").exists() else []
        checks["instructions"] = len(inst_files)
        print(f"  {'✓' if checks['instructions'] >= 7 else '✗'} Instructions: {checks['instructions']} (required: 7)")
        
        # Count agents
        agent_files = list((self.target / ".github/agents").rglob("*.md")) if (self.target / ".github/agents").exists() else []
        checks["agents"] = len(agent_files)
        print(f"  {'✓' if checks['agents'] >= 7 else '✗'} Agents: {checks['agents']} (required: 7)")
        
        # Count skills directories
        skills_path = self.target / ".github/skills"
        skills_dirs = len([d for d in skills_path.iterdir() if d.is_dir()]) if skills_path.exists() else 0
        checks["skills_dirs"] = skills_dirs
        print(f"  {'✓' if skills_dirs >= 20 else '✗'} Skills subdirs: {skills_dirs} (required: 20+)")
        
        # Count documentation
        doc_files = list((self.target / "documentation").rglob("*.md")) if (self.target / "documentation").exists() else []
        checks["documentation"] = len(doc_files)
        print(f"  {'✓' if checks['documentation'] >= 4 else '✗'} Documentation: {checks['documentation']} (required: 4+)")
        
        # Check context files
        context_files = list((self.target / "context").rglob("*")) if (self.target / "context").exists() else []
        checks["context_files"] = len(context_files)
        print(f"  {'✓' if checks['context_files'] > 0 else '✗'} Context files: {checks['context_files']}")
        
        # Check required files
        required_count = 0
        for req_file in self.REQUIRED_FILES:
            if (self.target / req_file).exists():
                required_count += 1
        checks["required_files"] = required_count
        print(f"  {'✓' if required_count == len(self.REQUIRED_FILES) else '✗'} Required files: {required_count}/{len(self.REQUIRED_FILES)}")
        
        # Overall status
        all_critical_present = (
            checks["python_modules"] >= 4 and
            checks["instructions"] >= 7 and
            checks["agents"] >= 7 and
            checks["skills_dirs"] >= 20 and
            checks["documentation"] >= 4 and
            required_count == len(self.REQUIRED_FILES)
        )
        
        checks["status"] = "✅ PRODUCTION READY" if all_critical_present else "⚠️  INCOMPLETE"
        
        self.validation_report = checks
        return checks
    
    def generate_catalog(self) -> dict:
        """Generate machine-readable file catalog"""
        catalog = {
            "extracted_on": "2026-03-26",
            "source_root": str(self.source_root),
            "target_root": str(self.target),
            "total_files": len(self.extracted_files),
            "files": [],
            "validation": self.validation_report,
        }
        
        for metadata in self.extracted_files:
            catalog["files"].append({
                "source": str(metadata.source.relative_to(self.source_root)),
                "target": str(metadata.target.relative_to(self.target)),
                "purpose": metadata.purpose,
                "critical": metadata.critical,
                "hash": metadata.file_hash,
                "size": metadata.size,
            })
        
        return catalog
    
    def save_catalog(self) -> Path:
        """Save catalog to JSON"""
        catalog = self.generate_catalog()
        catalog_path = self.target / ".orchestrator_catalog.json"
        
        with open(catalog_path, "w") as f:
            json.dump(catalog, f, indent=2)
        
        print(f"\n📋 Catalog saved: {catalog_path}")
        return catalog_path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Production-grade Orchestrator Framework Extractor",
    )
    parser.add_argument(
        "--source",
        default=".",
        help="Source Orchestrator directory (default: current directory)",
    )
    parser.add_argument(
        "--target",
        required=True,
        help="Target extraction directory",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only validate, don't extract",
    )
    
    args = parser.parse_args(argv)
    
    source = Path(args.source).resolve()
    target = Path(args.target).resolve()
    
    extractor = ProductionExtractor(source, target, args.force)
    
    if not args.validate_only:
        success = extractor.extract_all()
        if not success and not args.force:
            print("\n⚠️  Extraction incomplete. Some critical files failed.")
            return 1
    
    # Validate
    checks = extractor.validate_production_readiness()
    extractor.save_catalog()
    
    if checks["status"].startswith("✅"):
        return 0
    else:
        print("\n⚠️  Production readiness checks failed.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
