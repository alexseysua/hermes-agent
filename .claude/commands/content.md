---
description: ⚡⚡ Content — smart router for copy and content tasks
argument-hint: [user-request|issues]
---

Write or enhance content for this request:
<user_request>$ARGUMENTS</user_request>

**IMPORTANT:** Activate needed skills. Ensure token efficiency. Sacrifice grammar for concision.

## Smart Router

Analyze `$ARGUMENTS` to detect content mode, then apply the matching workflow:

### A) Enhance Existing Content
**Detect:** keywords `fix`, `improve`, `enhance`, `rewrite`, `update`, `change`, `edit`, or existing code/content provided in arguments

1. If screenshot/video provided: use `ai-multimodal` to analyze and describe issues in detail
2. Use `/scout:ext` (preferred) or `/scout` to find relevant files in codebase
3. Use `copywriter` agent to write enhanced copy directly into code files
4. Report back with summary

### B) Complex/Research-backed Content
**Detect:** long/detailed briefs, keywords `landing page`, `hero section`, `marketing`, `campaign`, `blog`, `research`, `SEO`, or brief spans multiple sections/pages

1. If screenshot/video provided: use `ai-multimodal` to analyze context in detail
2. Use multiple `researcher` agents in parallel to find relevant information
3. Use `/scout:ext` to search codebase for existing content patterns
4. Use `planner` agent to plan the copy structure
5. Use `copywriter` agent to write copy based on the plan
6. Report back with summary

### C) Quick/Simple Content (default)
**Default for short briefs, single copy elements, quick tasks**

1. If screenshot provided: use `ai-multimodal` to analyze context
2. If video provided: use `ai-multimodal` (`video-analysis`) to analyze content
3. Use `copywriter` agent to write the copy
4. Report back with summary

## Fallback

If mode is unclear after analysis, default to **Quick/Simple** (Section C).

## Notes
- For conversion optimization: use `/content:cro`
- All modes support screenshot/video context via `ai-multimodal`
