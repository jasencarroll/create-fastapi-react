#!/usr/bin/env python3
"""Scaffold a FastAPI + React full-stack app with auth, infra, and CI."""

import argparse
import os
import secrets
import shutil
import subprocess
import sys
from pathlib import Path

from utils.template import copy_template_directory, to_title_case

EXCLUDE_PATTERNS = [
    "node_modules",
    "bun.lock",
    "uv.lock",
    ".venv",
    "__pycache__",
    ".pyc",
    ".db",
    "dist",
    "build",
    ".env.local",
    ".DS_Store",
    ".log",
]


def generate_secret_key() -> str:
    return secrets.token_hex(32)


def validate_project_name(name: str) -> str | None:
    if not name or not name.strip():
        return "Project name is required"
    import re

    if len(name) == 1:
        if not re.match(r"^[a-zA-Z0-9]$", name):
            return "Single-character project name must be a letter or number"
    else:
        if not re.match(r"^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$", name):
            return (
                "Project name must contain only letters, numbers, and hyphens, "
                "and start/end with a letter or number"
            )
    return None


def main():
    parser = argparse.ArgumentParser(
        description="Scaffold a FastAPI + React full-stack app"
    )
    parser.add_argument("-n", "--name", help="Project name")
    parser.add_argument("-t", "--title", help="App title (default: derived from name)")
    parser.add_argument(
        "-a",
        "--auth",
        choices=["password", "magic-link"],
        default="password",
        help="Auth type (default: password)",
    )
    parser.add_argument(
        "--skip-install", action="store_true", help="Skip dependency installation"
    )
    parser.add_argument("-q", "--quiet", action="store_true", help="Suppress output")
    args = parser.parse_args()

    is_interactive = args.name is None

    if not args.quiet:
        print()
        print("  create-fastapi-react")
        print()
        print("  FastAPI + React full-stack scaffolder")
        print()

    # Get project name
    if is_interactive:
        project_name = input("  Project name: ").strip()
    else:
        project_name = args.name

    error = validate_project_name(project_name)
    if error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)

    # Get app title
    default_title = to_title_case(project_name)
    if is_interactive:
        title_input = input(f"  App title [{default_title}]: ").strip()
        app_title = title_input or default_title
    else:
        app_title = args.title or default_title

    # Get auth type
    if is_interactive:
        print()
        print("  Auth type:")
        print("  1. Email + Password (default)")
        print("  2. Magic Link")
        auth_choice = input("\n  Choose (1-2) [1]: ").strip()
        auth_type = "magic-link" if auth_choice == "2" else "password"
    else:
        auth_type = args.auth

    # Git init
    should_init_git = True
    if is_interactive:
        git_answer = input("\n  Initialize git? (Y/n): ").strip()
        should_init_git = git_answer.lower() != "n"

    project_path = Path.cwd() / project_name

    # Create project directory
    if project_path.exists():
        print(f"Error: Directory {project_name} already exists", file=sys.stderr)
        sys.exit(1)

    project_path.mkdir()

    if not args.quiet:
        print()
        print("  Scaffolding project...")
        print()

    # Generate secret key and template variables
    secret_key = generate_secret_key()
    variables = {
        "projectName": project_name,
        "appTitle": app_title,
        "secretKey": secret_key,
    }

    # Copy default template
    template_dir = Path(__file__).resolve().parent / "templates" / "default"
    if not template_dir.is_dir():
        print("Error: Template directory not found.", file=sys.stderr)
        sys.exit(1)

    copy_template_directory(
        str(template_dir), str(project_path), variables, EXCLUDE_PATTERNS
    )

    # Apply magic-link overlay
    if auth_type == "magic-link":
        overlay_dir = Path(__file__).resolve().parent / "templates" / "magic-link"
        if overlay_dir.is_dir():
            copy_template_directory(
                str(overlay_dir), str(project_path), variables, EXCLUDE_PATTERNS
            )

    if not args.quiet:
        print("  Created project structure")

    # Create .env from .env.example
    env_example = project_path / ".env.example"
    env_file = project_path / ".env"
    if env_example.exists():
        content = env_example.read_text()
        import re

        content = re.sub(r"SECRET_KEY=.*", f"SECRET_KEY={secret_key}", content)
        env_file.write_text(content)
        env_file.chmod(0o600)

    # Create data directory
    (project_path / "backend" / "data").mkdir(parents=True, exist_ok=True)

    # Install dependencies
    if not args.skip_install:
        if shutil.which("uv"):
            if not args.quiet:
                print("  Installing backend dependencies...")
            result = subprocess.run(
                ["uv", "sync"],
                cwd=project_path / "backend",
                capture_output=True,
            )
            if result.returncode == 0 and not args.quiet:
                print("  Backend dependencies installed")

        if shutil.which("bun"):
            if not args.quiet:
                print("  Installing frontend dependencies...")
            result = subprocess.run(
                ["bun", "install"],
                cwd=project_path / "frontend",
                capture_output=True,
            )
            if result.returncode == 0 and not args.quiet:
                print("  Frontend dependencies installed")

        # Run alembic
        if shutil.which("uv"):
            if not args.quiet:
                print("  Running initial database migration...")
            env = os.environ.copy()
            env["DATABASE_URL"] = f"sqlite:///./data/{project_name}.db"
            result = subprocess.run(
                ["uv", "run", "alembic", "upgrade", "head"],
                cwd=project_path / "backend",
                capture_output=True,
                env=env,
            )
            if result.returncode == 0 and not args.quiet:
                print("  Database initialized")

    # Git init
    if should_init_git and shutil.which("git"):
        subprocess.run(
            ["git", "init"], cwd=project_path, capture_output=True
        )
        subprocess.run(
            ["git", "add", "-A"], cwd=project_path, capture_output=True
        )
        subprocess.run(
            ["git", "commit", "-m", "Initial commit from create-fastapi-react"],
            cwd=project_path,
            capture_output=True,
        )
        if not args.quiet:
            print("  Git repository initialized")

    if not args.quiet:
        print()
        print("  Done! Your project is ready.")
        print()
        print(f"  cd {project_name}")
        print()
        print("  Development:")
        print("    bun run dev          Start both frontend and backend")
        print()
        print("  Or run separately:")
        print("    cd backend && uv run uvicorn app.main:app --reload")
        print("    cd frontend && bun run dev")
        print()


if __name__ == "__main__":
    main()
