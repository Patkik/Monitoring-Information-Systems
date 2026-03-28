from pathlib import Path

def get_project_root() -> Path:
    """
    Returns the absolute path to the root of the package.
    This dynamically calculates the path based on this file's location,
    so it works correctly whether running from source or installed via pip.
    """
    # __file__ is orchestrator/paths.py
    # parent is orchestrator/
    # parent.parent is the root directory containing .agents, scripts, docs, etc.
    return Path(__file__).resolve().parent.parent

def get_agents_dir() -> Path:
    """Returns the absolute path to the .agents directory."""
    return get_project_root() / ".agents"

def get_skills_dir() -> Path:
    """Returns the absolute path to the .agents/skills directory."""
    return get_agents_dir() / "skills"

def get_scripts_dir() -> Path:
    """Returns the absolute path to the scripts directory."""
    return get_project_root() / "scripts"

def get_docs_dir() -> Path:
    """Returns the absolute path to the docs directory."""
    return get_project_root() / "docs"

def get_github_dir() -> Path:
    """Returns the absolute path to the .github directory."""
    return get_project_root() / ".github"

# Exportable constants for easy access
PROJECT_ROOT = get_project_root()
AGENTS_DIR = get_agents_dir()
SKILLS_DIR = get_skills_dir()
SCRIPTS_DIR = get_scripts_dir()
DOCS_DIR = get_docs_dir()
GITHUB_DIR = get_github_dir()

def resolve_path(*path_parts: str) -> Path:
    """
    Safely build a path from the project root.
    Example: resolve_path('scripts', 'simulate_workflow.py') -> Absolute Path
    """
    return PROJECT_ROOT.joinpath(*path_parts)
