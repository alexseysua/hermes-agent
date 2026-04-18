#!/usr/bin/env python3
"""Sync the 9router model catalog in hermes_cli/models.py from a live server.

Reads GET <base-url>/v1/models and rewrites the ``"9router": [ ... ]`` entry
in ``_PROVIDER_MODELS``.  Dev helper — run after the 9router dashboard adds
or removes providers.

Usage:
    python scripts/sync-9router-models.py
    python scripts/sync-9router-models.py --base-url http://localhost:20128/v1
    python scripts/sync-9router-models.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from collections import defaultdict
from pathlib import Path

# Ordering of provider-prefix buckets + their human label for comments.
GROUP_ORDER: list[tuple[str, str]] = [
    ("cc", "Claude Code OAuth (subscription)"),
    ("cx", "Codex OAuth (subscription)"),
    ("gc", "Gemini CLI OAuth (subscription)"),
    ("qw", "Qwen direct OAuth"),
    ("kc", "KiloCode gateway"),
    ("kr", "Kiro"),
    ("if", "iFlow (free tier)"),
    ("glm", "GLM / Z.AI (cheap)"),
    ("kimi", "Kimi / Moonshot"),
    ("minimax", "MiniMax direct"),
]

MODELS_PY = Path(__file__).resolve().parent.parent / "hermes_cli" / "models.py"


def fetch_models(base_url: str) -> list[str]:
    url = base_url.rstrip("/") + "/models"
    with urllib.request.urlopen(url, timeout=10) as resp:
        payload = json.load(resp)
    return [m["id"] for m in payload.get("data", []) if isinstance(m, dict) and "id" in m]


def group_models(ids: list[str]) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = defaultdict(list)
    for mid in ids:
        prefix = mid.split("/", 1)[0]
        groups[prefix].append(mid)
    for prefix in groups:
        groups[prefix].sort()
    return groups


def render_block(groups: dict[str, list[str]]) -> str:
    """Produce the Python literal body (indented four spaces) for the 9router list."""
    lines: list[str] = []
    seen: set[str] = set()
    for prefix, label in GROUP_ORDER:
        if prefix not in groups:
            continue
        lines.append(f"        # {prefix}/ — {label}")
        for mid in groups[prefix]:
            lines.append(f'        "{mid}",')
        seen.add(prefix)
    # Any prefixes the server exposes that we didn't pre-classify.
    extras = sorted(set(groups) - seen)
    if extras:
        lines.append("        # Unclassified prefixes from server")
        for prefix in extras:
            for mid in groups[prefix]:
                lines.append(f'        "{mid}",')
    return "\n".join(lines)


# Matches the whole "9router": [ ... ] entry including the trailing comma.
_PATTERN = re.compile(
    r'(    "9router": \[\n)(.*?)(^    \],\n)',
    re.DOTALL | re.MULTILINE,
)


def replace_block(source: str, new_body: str) -> str:
    def _sub(match: re.Match[str]) -> str:
        return match.group(1) + new_body + "\n" + match.group(3)

    new_source, n = _PATTERN.subn(_sub, source, count=1)
    if n != 1:
        raise RuntimeError(
            'Could not locate the `"9router": [ ... ]` block in hermes_cli/models.py. '
            "Has the file structure changed?"
        )
    return new_source


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default=os.environ.get("NINEROUTER_BASE_URL", "http://localhost:20128/v1"),
        help="9router OpenAI-compatible base URL (default: %(default)s)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the new block instead of rewriting the file.",
    )
    args = parser.parse_args()

    try:
        ids = fetch_models(args.base_url)
    except Exception as exc:
        print(f"error: failed to fetch models from {args.base_url}: {exc}", file=sys.stderr)
        return 2

    if not ids:
        print(f"error: server returned no models", file=sys.stderr)
        return 2

    groups = group_models(ids)
    new_body = render_block(groups)

    if args.dry_run:
        print(new_body)
        print(f"\n# total: {len(ids)} models in {len(groups)} groups", file=sys.stderr)
        return 0

    source = MODELS_PY.read_text(encoding="utf-8")
    new_source = replace_block(source, new_body)
    if new_source == source:
        print("no changes — hermes_cli/models.py already up-to-date")
        return 0

    MODELS_PY.write_text(new_source, encoding="utf-8")
    print(f"updated {MODELS_PY.relative_to(Path.cwd())} — {len(ids)} models in {len(groups)} groups")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
