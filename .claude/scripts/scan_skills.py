#!/usr/bin/env python3
"""
Scan .claude/skills directory and extract skill metadata.
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

def extract_first_paragraph(content: str) -> str:
    """Extract first meaningful paragraph after frontmatter."""
    # Remove frontmatter
    content = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL)

    # Find first paragraph (after headings)
    lines = content.split('\n')
    paragraph = []

    for line in lines:
        line = line.strip()
        # Skip headings and empty lines
        if line.startswith('#') or not line:
            if paragraph:  # If we've started collecting, stop
                break
            continue

        paragraph.append(line)

        # Stop after first paragraph
        if line.endswith('.') and len(' '.join(paragraph)) > 50:
            break

    return ' '.join(paragraph)[:200]

EXCLUDED_DIRS = {'skills-archived', 'commands-archived', 'template-skill'}


def scan_skills(base_path: Path) -> List[Dict]:
    """Scan all skill files and extract metadata."""
    skills = []

    for skill_file in sorted(base_path.rglob('SKILL.md')):
        # Skip files inside archived or template directories
        if any(part in EXCLUDED_DIRS for part in skill_file.parts):
            continue

        # Get skill directory name
        skill_dir = skill_file.parent
        skill_name = skill_dir.name

        # Skip template (belt-and-suspenders check)
        if skill_name == 'template-skill':
            continue

        # Handle nested skills (like document-skills/*)
        if skill_dir.parent.name != 'skills':
            parent_name = skill_dir.parent.name
            skill_name = f"{parent_name}/{skill_name}"

        try:
            content = skill_file.read_text()
            frontmatter = extract_frontmatter(content)

            description = frontmatter.get('description', '')
            if not description:
                description = extract_first_paragraph(content)

            # Categorize based on content/name
            category = categorize_skill(skill_name, description, content)

            skills.append({
                'name': skill_name,
                'path': str(skill_file.relative_to(base_path)),
                'description': description,
                'category': category,
                'has_scripts': (skill_dir / 'scripts').exists(),
                'has_references': (skill_dir / 'references').exists()
            })
        except Exception as e:
            print(f"Error processing {skill_file}: {e}")

    return skills


def get_skills_paths() -> List[tuple]:
    """Get skills directories: global + project (if exists)."""
    paths = []
    global_path = Path.home() / '.claude' / 'skills'
    local_path = Path('.claude/skills')
    if global_path.exists():
        paths.append(('global', global_path))
    if local_path.exists() and local_path.resolve() != global_path.resolve():
        paths.append(('project', local_path))
    return paths

def categorize_skill(name: str, description: str, content: str) -> str:
    """Categorize skill based on name and content."""
    lower_name = name.lower()
    lower_desc = description.lower()
    lower_content = content[:500].lower()

    # AI/ML
    if any(x in lower_name for x in ['ai-', 'gemini', 'multimodal', 'adk']):
        return 'ai-ml'

    # Frontend
    if any(x in lower_name for x in ['frontend', 'ui', 'design', 'aesthetic', 'threejs']):
        return 'frontend'

    # Backend
    if any(x in lower_name for x in ['backend', 'auth', 'payment']):
        return 'backend'

    # Infrastructure
    if any(x in lower_name for x in ['devops', 'docker', 'cloudflare', 'gcloud']):
        return 'infrastructure'

    # Database
    if any(x in lower_name for x in ['database', 'mongodb', 'postgresql', 'sql']):
        return 'database'

    # Development Tools
    if any(x in lower_name for x in ['mcp', 'skill-creator', 'claude-code', 'repomix', 'docs-seeker']):
        return 'dev-tools'

    # Multimedia
    if any(x in lower_name for x in ['media', 'chrome-devtools', 'document-skills']):
        return 'multimedia'

    # Frameworks
    if any(x in lower_name for x in ['web-frameworks', 'mobile', 'shopify']):
        return 'frameworks'

    # Utilities
    if any(x in lower_name for x in ['debug', 'problem', 'code-review', 'planning', 'research', 'sequential']):
        return 'utilities'

    return 'other'

def group_by_category(skills: List[Dict]) -> Dict[str, List[Dict]]:
    """Group skills by category."""
    categories = {}

    for skill in skills:
        category = skill['category']
        if category not in categories:
            categories[category] = []
        categories[category].append(skill)

    return categories

SCRIPT_DIR = Path(__file__).parent


def main():
    """Main execution."""
    paths = get_skills_paths()

    if not paths:
        # Fallback: try CWD-relative (backward compat)
        base_path = Path('.claude/skills')
        if base_path.exists():
            paths = [('local', base_path)]
        else:
            print("Error: No skills directory found")
            return

    all_skills = {}  # name → skill dict (project overrides global)
    for source, base_path in paths:
        print(f"Scanning skills ({source}: {base_path})...")
        skills = scan_skills(base_path)
        for skill in skills:
            all_skills[skill['name']] = skill  # Later entry (project) wins

    skills_list = list(all_skills.values())
    print(f"\nFound {len(skills_list)} skills\n")

    # Group by category
    categories = group_by_category(skills_list)

    category_names = {
        'ai-ml': 'AI & Machine Learning',
        'frontend': 'Frontend & Design',
        'backend': 'Backend Development',
        'infrastructure': 'Infrastructure & DevOps',
        'database': 'Database & Storage',
        'dev-tools': 'Development Tools',
        'multimedia': 'Multimedia & Processing',
        'frameworks': 'Frameworks & Platforms',
        'utilities': 'Utilities & Helpers',
        'other': 'Other'
    }

    for category, cat_skills in sorted(categories.items()):
        print(f"\n{category_names.get(category, category.upper())}:")
        for skill in cat_skills:
            scripts = '\U0001f4e6' if skill['has_scripts'] else '  '
            refs = '\U0001f4da' if skill['has_references'] else '  '
            print(f"  {scripts}{refs} {skill['name']:30} {skill['description'][:80]}")

    # Output YAML for processing (generate_catalogs.py reads YAML)
    output_path = SCRIPT_DIR / 'skills_data.yaml'
    output_path.write_text(yaml.dump(skills_list, allow_unicode=True, default_flow_style=False))
    print(f"\n\u2713 Saved metadata to {output_path}")

if __name__ == '__main__':
    main()
