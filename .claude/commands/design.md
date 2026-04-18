---
description: ⚡⚡ Design — smart router for design tasks [auto-detects input type]
argument-hint: [tasks|screenshot-path|video-path|url]
---

Think hard to plan & start working on these design tasks:
<tasks>$ARGUMENTS</tasks>

## Required Skills (Priority Order)
1. **`ui-ux-pro-max`** - Design intelligence database (ALWAYS ACTIVATE FIRST)
2. **`frontend-design`** - Implementation patterns

**Ensure token efficiency while maintaining high quality.**

## Smart Router

Analyze `$ARGUMENTS` to detect input type, then apply the matching workflow:

### A) Screenshot Input
**Detect:** file path ending in `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, or URL pointing to image

1. Use `ai-multimodal` to describe every design detail (style, fonts, colors, spacing, borders, elements, interactions, typography — try to predict font names from Google Fonts, not just Inter/Poppins)
2. Use `ui-ux-designer` subagent to create a design plan following progressive disclosure structure
3. Implement plan step by step
4. Output in pure HTML/CSS/JS unless user specifies otherwise
5. Report to user, ask to approve; if approved, update `./docs/design-guidelines.md`

### B) Video Input
**Detect:** file path ending in `.mp4`, `.mov`, `.webm`, `.avi`, or URL pointing to video

1. Use `ai-multimodal` (`video-analysis`) to describe every element, interaction, animation, transition, color, font, spacing, etc. (predict font names from Google Fonts)
2. Use `ui-ux-designer` subagent to create a design plan following progressive disclosure structure
3. Implement plan step by step
4. Output in pure HTML/CSS/JS unless user specifies otherwise
5. Report to user, ask to approve; if approved, update `./docs/design-guidelines.md`

### C) Text Description (default)
**Default when no file/video path detected — standard design creation**

1. **FIRST**: Run `ui-ux-pro-max` searches to gather design intelligence:
   ```bash
   python3 $HOME/.claude/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
   python3 $HOME/.claude/skills/ui-ux-pro-max/scripts/search.py "<style-keywords>" --domain style
   python3 $HOME/.claude/skills/ui-ux-pro-max/scripts/search.py "<mood>" --domain typography
   python3 $HOME/.claude/skills/ui-ux-pro-max/scripts/search.py "<industry>" --domain color
   ```
2. Use `ui-ux-designer` subagent to start the design process
3. Output in pure HTML/CSS/JS unless user specifies otherwise
4. Report to user, ask to approve; if approved, update `./docs/design-guidelines.md`

## Fallback

If input type is ambiguous, use `AskUserQuestion` to ask: "Is this a screenshot/video path or a text description?"

## Notes
- Generate assets with `ai-multimodal` skill (images, textures, etc.)
- Always verify generated assets with `ai-multimodal`
- Use background removal tools if needed
- For immersive/research-backed design: use `/design:immersive`
- For 3D/Three.js designs: use `/design:3d`
- Maintain and update `./docs/design-guidelines.md`
