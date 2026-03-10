"""Template engine for create-fastapi-react (stdlib only)."""

import os
import re
import shutil


TEXT_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".json", ".md", ".txt", ".css",
    ".html", ".yml", ".yaml", ".toml", ".py", ".cfg", ".ini", ".sh",
    ".env", ".example", ".gitignore", ".mako",
}


def process_template(content: str, variables: dict[str, str]) -> str:
    for key, value in variables.items():
        if value is not None:
            content = re.sub(re.escape("{{" + key + "}}"), value, content)
    return content


def should_exclude(item: str, patterns: list[str]) -> bool:
    for pattern in patterns:
        if pattern.startswith("*."):
            if item.endswith(pattern[1:]):
                return True
        elif item == pattern:
            return True
    return False


def copy_template_directory(
    source_dir: str,
    target_dir: str,
    variables: dict[str, str],
    exclude_patterns: list[str] | None = None,
) -> None:
    if exclude_patterns is None:
        exclude_patterns = []

    os.makedirs(target_dir, exist_ok=True)

    for item in os.listdir(source_dir):
        if should_exclude(item, exclude_patterns):
            continue

        source_path = os.path.join(source_dir, item)
        target_path = os.path.join(target_dir, item)

        if os.path.isdir(source_path):
            copy_template_directory(
                source_path, target_path, variables, exclude_patterns
            )
        else:
            copy_template_file(source_path, target_path, variables)


def copy_template_file(
    source_path: str, target_path: str, variables: dict[str, str]
) -> None:
    os.makedirs(os.path.dirname(target_path), exist_ok=True)

    _, ext = os.path.splitext(source_path)
    is_text = ext in TEXT_EXTENSIONS or ".env" in os.path.basename(source_path)

    if is_text:
        with open(source_path, "r") as f:
            content = f.read()
        processed = process_template(content, variables)
        with open(target_path, "w") as f:
            f.write(processed)
    else:
        shutil.copy2(source_path, target_path)


def to_title_case(name: str) -> str:
    return " ".join(word.capitalize() for word in name.split("-"))
