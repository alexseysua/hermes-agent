#!/usr/bin/env python3
"""
Scan .claude/commands directory and extract command metadata.
"""

import re
from pathlib import Path
from typing import Dict, List
import yaml

def extract_frontmatter(content: str) -> Dict:
    """Extract YAML frontmatter from markdown content."""
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except:
            return {}
    return {}

def get_commands_paths() -> List[tuple]:
    """Get commands directories: global + project (if exists)."""
    paths = []
    global_path = Path.home() / '.claude' / 'commands'
    local_path = Path('.claude/commands')
    if global_path.exists():
        paths.append(('global', global_path))
    if local_path.exists() and local_path.resolve() != global_path.resolve():
        paths.append(('project', local_path))
    return paths


EXCLUDED_DIRS = {'commands-archived', 'skills-archived'}


def scan_commands(base_path: Path) -> List[Dict]:
    """Scan all command files and extract metadata."""
    commands = []

    for cmd_file in sorted(base_path.rglob('*.md')):
        # Skip files inside archived directories
        if any(part in EXCLUDED_DIRS for part in cmd_file.parts):
            continue

        # Get relative path from commands directory
        rel_path = cmd_file.relative_to(base_path)

        # Build command name from path
        parts = list(rel_path.parts[:-1]) + [rel_path.stem]
        command_name = '/ck:' + ':'.join(parts)

        # Read file and extract frontmatter
        try:
            content = cmd_file.read_text()
            frontmatter = extract_frontmatter(content)

            description = frontmatter.get('description', '')
            arg_hint = frontmatter.get('argument-hint', '')

            # Extract power level (⚡ count)
            power_level = description.count('⚡')
            clean_desc = description.replace('⚡', '').strip()

            commands.append({
                'name': command_name,
                'path': str(rel_path),
                'description': clean_desc,
                'argument_hint': arg_hint,
                'power_level': power_level,
                'category': parts[0] if len(parts) > 1 else 'core'
            })
        except Exception as e:
            print(f"Error processing {cmd_file}: {e}")

    return commands

def group_by_category(commands: List[Dict]) -> Dict[str, List[Dict]]:
    """Group commands by category."""
    categories = {}

    for cmd in commands:
        category = cmd['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(cmd)

    return categories

SCRIPT_DIR = Path(__file__).parent


def main():
    """Main execution."""
    paths = get_commands_paths()

    if not paths:
        # Fallback: try CWD-relative (backward compat)
        base_path = Path('.claude/commands')
        if base_path.exists():
            paths = [('local', base_path)]
        else:
            print("Error: No commands directory found")
            return

    all_commands = {}  # name → command dict (project overrides global)
    for source, base_path in paths:
        print(f"Scanning commands ({source}: {base_path})...")
        commands = scan_commands(base_path)
        for cmd in commands:
            all_commands[cmd['name']] = cmd  # Later entry (project) wins

    commands_list = list(all_commands.values())
    print(f"\nFound {len(commands_list)} commands\n")

    # Group by category
    categories = group_by_category(commands_list)

    for category, cmds in sorted(categories.items()):
        print(f"\n{category.upper()}:")
        for cmd in cmds:
            power = '\u26a1' * cmd['power_level'] if cmd['power_level'] > 0 else ''
            print(f"  {cmd['name']:40} {power:10} {cmd['description'][:80]}")

    # Output YAML for processing (generate_catalogs.py expects YAML format)
    output_path = SCRIPT_DIR / 'commands_data.yaml'
    output_path.write_text(yaml.dump(commands_list, allow_unicode=True, default_flow_style=False))
    print(f"\n\u2713 Saved metadata to {output_path}")

if __name__ == '__main__':
    main()
