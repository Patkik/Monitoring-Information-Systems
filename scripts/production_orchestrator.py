#!/usr/bin/env python3
"""
Production Orchestration Manager

Comprehensive orchestration tool that:
1. Validates project structure
2. Runs production extractors
3. Converts documentation
4. Generates context folders
5. Performs integrity checks
6. Generates reports

Usage:
    python production_orchestrator.py --action full --target /path/to/target

Actions:
    - validate: Validate project structure only
    - extract: Extract all critical files
    - convert: Convert documentation
    - context: Generate context folder
    - full: Run all steps
    - report: Generate HTML report
"""

from __future__ import annotations

import sys
import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional
import argparse


class ProductionOrchestrator:
    """High-level orchestration for production setup"""
    
    def __init__(self, workspace_root: Path, target: Path):
        self.workspace_root = workspace_root.resolve()
        self.target = target.resolve()
        self.scripts_dir = self.workspace_root / "scripts"
        self.report = {
            "timestamp": datetime.now().isoformat(),
            "workspace": str(self.workspace_root),
            "target": str(self.target),
            "steps": {},
            "status": "pending",
        }
    
    def validate_project_structure(self) -> bool:
        """Validate that critical directories exist"""
        print("\n🔍 VALIDATION: Project Structure")
        print("=" * 60)
        
        critical_paths = {
            "orchestrator": "Python orchestration module",
            ".github/instructions": "Agent instructions",
            ".github/agents": "Agent definitions",
            ".github/skills": "Skills library",
            ".github/hooks": "Git hooks",
            "documentation": "Documentation files",
            "context": "Context folder",
            "pyproject.toml": "Project configuration",
            "README.md": "README file",
        }
        
        validation_results = {}
        all_valid = True
        
        for path_str, description in critical_paths.items():
            full_path = self.workspace_root / path_str
            exists = full_path.exists()
            validation_results[path_str] = {
                "description": description,
                "exists": exists,
            }
            
            status = "✅" if exists else "❌"
            print(f"  {status} {path_str}: {description}")
            
            if not exists:
                all_valid = False
        
        self.report["steps"]["validation"] = {
            "status": "PASSED" if all_valid else "FAILED",
            "results": validation_results,
        }
        
        return all_valid
    
    def run_extractor(self, force: bool = False) -> bool:
        """Run production extractor"""
        print("\n📦 EXTRACTION: Critical Files")
        print("=" * 60)
        
        extractor_script = self.scripts_dir / "production_extractor.py"
        
        if not extractor_script.exists():
            print(f"  ❌ Extractor script not found: {extractor_script}")
            self.report["steps"]["extraction"] = {
                "status": "FAILED",
                "error": "Extractor script not found",
            }
            return False
        
        cmd = [
            sys.executable,
            str(extractor_script),
            "--source", str(self.workspace_root),
            "--target", str(self.target),
        ]
        
        if force:
            cmd.append("--force")
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print("  ✅ Extraction successful")
                self.report["steps"]["extraction"] = {
                    "status": "SUCCESS",
                    "output": result.stdout[-500:] if result.stdout else "",
                }
                return True
            else:
                print(f"  ❌ Extraction failed: {result.stderr}")
                self.report["steps"]["extraction"] = {
                    "status": "FAILED",
                    "error": result.stderr[-500:] if result.stderr else "Unknown error",
                }
                return False
        except Exception as e:
            print(f"  ❌ Extraction error: {e}")
            self.report["steps"]["extraction"] = {
                "status": "FAILED",
                "error": str(e),
            }
            return False
    
    def run_documentation_converter(self) -> bool:
        """Run documentation converter"""
        print("\n📚 CONVERSION: Documentation")
        print("=" * 60)
        
        converter_script = self.scripts_dir / "documentation_converter.py"
        
        if not converter_script.exists():
            print(f"  ❌ Converter script not found: {converter_script}")
            self.report["steps"]["documentation"] = {
                "status": "FAILED",
                "error": "Converter script not found",
            }
            return False
        
        docs_dir = self.workspace_root / "documentation"
        output_dir = self.target / "documentation_schemas"
        
        cmd = [
            sys.executable,
            str(converter_script),
            "--source", str(docs_dir),
            "--output", str(output_dir),
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print("  ✅ Documentation conversion successful")
                self.report["steps"]["documentation"] = {
                    "status": "SUCCESS",
                    "output_dir": str(output_dir),
                }
                return True
            else:
                print(f"  ⚠️  Conversion completed with warnings: {result.stderr[-200:]}")
                self.report["steps"]["documentation"] = {
                    "status": "PARTIAL",
                    "error": result.stderr[-500:] if result.stderr else "",
                }
                return True  # Non-fatal
        except Exception as e:
            print(f"  ⚠️  Conversion error (non-fatal): {e}")
            self.report["steps"]["documentation"] = {
                "status": "PARTIAL",
                "error": str(e),
            }
            return True  # Non-fatal
    
    def run_context_generator(self) -> bool:
        """Run context folder generator"""
        print("\n🏗️  GENERATION: Context Folder")
        print("=" * 60)
        
        generator_script = self.scripts_dir / "context_generator.py"
        
        if not generator_script.exists():
            print(f"  ❌ Generator script not found: {generator_script}")
            self.report["steps"]["context"] = {
                "status": "FAILED",
                "error": "Generator script not found",
            }
            return False
        
        cmd = [
            sys.executable,
            str(generator_script),
            "--target", str(self.target),
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                print("  ✅ Context generation successful")
                self.report["steps"]["context"] = {
                    "status": "SUCCESS",
                    "context_path": str(self.target / "context"),
                }
                return True
            else:
                print(f"  ❌ Context generation failed: {result.stderr}")
                self.report["steps"]["context"] = {
                    "status": "FAILED",
                    "error": result.stderr[-500:] if result.stderr else "Unknown error",
                }
                return False
        except Exception as e:
            print(f"  ❌ Context generation error: {e}")
            self.report["steps"]["context"] = {
                "status": "FAILED",
                "error": str(e),
            }
            return False
    
    def run_integrity_check(self) -> bool:
        """Verify integrity of extracted files"""
        print("\n🔐 VERIFICATION: File Integrity")
        print("=" * 60)
        
        # Check catalog exists
        catalog_path = self.target / ".orchestrator_catalog.json"
        
        if not catalog_path.exists():
            print(f"  ⚠️  Catalog not found (may need extraction first)")
            return True  # Non-fatal
        
        try:
            with open(catalog_path, "r") as f:
                catalog = json.load(f)
            
            validation = catalog.get("validation", {})
            total_files = catalog.get("total_files", 0)
            
            print(f"  📊 Catalog Status: {validation.get('status', 'UNKNOWN')}")
            print(f"  📁 Total Files: {total_files}")
            print(f"  🐍 Python Modules: {validation.get('python_modules', 0)}")
            print(f"  📝 Instructions: {validation.get('instructions', 0)}")
            print(f"  🤖 Agents: {validation.get('agents', 0)}")
            print(f"  🎯 Skills: {validation.get('skills_dirs', 0)}")
            
            self.report["steps"]["integrity"] = {
                "status": "VERIFIED",
                "catalog": catalog,
            }
            
            return validation.get("status", "").startswith("✅")
        
        except Exception as e:
            print(f"  ⚠️  Integrity check error: {e}")
            return True  # Non-fatal
    
    def generate_report(self) -> Path:
        """Generate production report"""
        print("\n📋 REPORT: Production Setup")
        print("=" * 60)
        
        # Finalize report
        all_success = all(
            step.get("status") in ["SUCCESS", "VERIFIED", "PASSED"]
            for step in self.report["steps"].values()
        )
        
        self.report["status"] = "✅ PRODUCTION READY" if all_success else "⚠️  INCOMPLETE"
        
        # Save report
        report_path = self.target / "PRODUCTION_REPORT.json"
        with open(report_path, "w") as f:
            json.dump(self.report, f, indent=2)
        
        print(f"\n{'✅' if all_success else '⚠️ '} Production Report:")
        print(f"  Status: {self.report['status']}")
        print(f"  Location: {report_path}")
        print(f"  Steps: {len(self.report['steps'])}")
        
        # Print summary
        for step_name, step_result in self.report["steps"].items():
            status_icon = "✅" if step_result.get("status") in ["SUCCESS", "VERIFIED", "PASSED"] else "⚠️ "
            print(f"    {status_icon} {step_name}: {step_result.get('status', 'UNKNOWN')}")
        
        return report_path
    
    def run_full_pipeline(self, force: bool = False) -> bool:
        """Run complete production pipeline"""
        print("\n" + "=" * 60)
        print("🚀 PRODUCTION ORCHESTRATION PIPELINE")
        print("=" * 60)
        print(f"Workspace: {self.workspace_root}")
        print(f"Target: {self.target}")
        print()
        
        steps = [
            ("validation", self.validate_project_structure),
            ("extraction", lambda: self.run_extractor(force)),
            ("documentation", self.run_documentation_converter),
            ("context", self.run_context_generator),
            ("integrity", self.run_integrity_check),
        ]
        
        for step_name, step_func in steps:
            try:
                if not step_func():
                    if step_name in ["validation", "extraction", "context"]:
                        print(f"\n❌ Pipeline halted at {step_name}")
                        self.report["status"] = f"FAILED at {step_name}"
                        self.generate_report()
                        return False
            except Exception as e:
                print(f"\n❌ Error in {step_name}: {e}")
                self.report["status"] = f"ERROR in {step_name}"
                self.generate_report()
                return False
        
        # Generate final report
        self.generate_report()
        
        return True


def main(argv: list[str] | None = None) -> int:
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Production Orchestration Manager",
    )
    parser.add_argument(
        "--workspace",
        default=".",
        help="Source workspace directory",
    )
    parser.add_argument(
        "--target",
        required=True,
        help="Target extraction directory",
    )
    parser.add_argument(
        "--action",
        choices=["validate", "extract", "convert", "context", "full", "report"],
        default="full",
        help="Action to perform",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing files",
    )
    
    args = parser.parse_args(argv)
    
    workspace = Path(args.workspace).resolve()
    target = Path(args.target).resolve()
    
    orchestrator = ProductionOrchestrator(workspace, target)
    
    if args.action == "validate":
        return 0 if orchestrator.validate_project_structure() else 1
    elif args.action == "extract":
        return 0 if orchestrator.run_extractor(args.force) else 1
    elif args.action == "convert":
        return 0 if orchestrator.run_documentation_converter() else 1
    elif args.action == "context":
        return 0 if orchestrator.run_context_generator() else 1
    elif args.action == "report":
        orchestrator.generate_report()
        return 0
    else:  # full
        return 0 if orchestrator.run_full_pipeline(args.force) else 1


if __name__ == "__main__":
    raise SystemExit(main())
