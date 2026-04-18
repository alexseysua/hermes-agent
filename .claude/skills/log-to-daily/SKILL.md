---
name: log-to-daily
description: Логування активності розмови до щоденника за запитом. Використовуй при завершенні роботи, фіксації рішень або документуванні результатів сесії.
use_when: User asks to log to daily note, capture session activity, document what was done, or record decisions made during the conversation.
user-invocable: true
---

<objective>
Append a structured summary of current session activity to today's daily note. This creates the data layer that vault-analyst reads to discover your work patterns.
</objective>

<when_to_use>
- **Start of session** — log focus area, branch, planned work (brief)
- **End of session** — log completed work, decisions, next steps
- After completing a significant piece of work
- When important decisions were made that should be recorded
- When the user explicitly requests logging (`/log-to-daily`)
- Mid-session when switching contexts

**NOT needed when:**
- Just chatting without meaningful work output
- Quick questions with no decisions or outcomes
</when_to_use>

<daily_note_location>
**Vault:** `~/LifeOS-Obsidian/`
**Path pattern:** `4-Щоденник/YYYY-MM-DD.md`

Example: `/home/alexs/LifeOS-Obsidian/4-Щоденник/2026-02-05.md`

The daily note should already exist. If not, create with frontmatter matching existing daily notes format.
</daily_note_location>

<log_format>
```markdown
---

## Session Log - [TIME]

**Focus:** [1-2 sentence summary of main work]

### Completed
- [Concrete outcome 1]
- [Concrete outcome 2]

### Decisions Made
| Decision | Rationale |
|----------|-----------|
| [Decision] | [Why] |

### Files Created/Modified
- [[filename]] - [what/why]

### Next Steps
- [ ] [Follow-up task if any]

---
```
</log_format>

<process>
1. **Analyze the conversation** for:
   - Main topics/tasks worked on
   - Concrete outputs (files created, code written, research done)
   - Decisions made and their rationale
   - Outstanding items or next steps

2. **Locate today's daily note**
   - Vault path: `~/LifeOS-Obsidian/`
   - Daily note path: `4-Щоденник/YYYY-MM-DD.md` (e.g. `4-Щоденник/2026-02-06.md`)
   - Create if it doesn't exist (use minimal frontmatter from existing daily notes)

3. **Append the session log** using the format above
   - Use `---` separator before the log
   - Include timestamp (user's local time)
   - Be specific about outcomes, not activities
   - Link to created files with `[[wikilinks]]`

4. **Confirm** what was logged
</process>

<quality_guidelines>
**Good entries:**
- "Created YouTube analytics inbox item with 3 integration options"
- "Refactored authentication to use JWT instead of sessions"
- "Decision: Use Postgres over SQLite (need concurrent writes)"

**Bad entries:**
- "Worked on stuff"
- "Had a conversation about the project"
- "Did some research"

**Be specific.** Capture what was DONE, not what was discussed.

**Why this matters:** Vault-analyst reads these logs to find patterns. Vague entries = weak pattern detection. Specific entries = actionable automation recommendations.
</quality_guidelines>

<example_output>
---

## Session Log - 2:45 PM

**Focus:** Local LLM integration for cost optimization

### Completed
- Overhauled inbox-processor with local_classify integration
- Created keep-warm launchd agent for Ollama (4-min interval)
- Tested classification accuracy on inbox items (~66%)

### Decisions Made
| Decision | Rationale |
|----------|-----------|
| Hybrid local/cloud pattern | Local does mechanical work, Claude does judgment |
| 4-minute keep-warm interval | Prevents cold start without wasting resources |

### Files Created/Modified
- [[inbox-processor]] - Added local LLM pre-classification
- [[local-llm-hybrid]] - NEW: Pattern documentation

### Next Steps
- [ ] Monitor token savings over next week
- [ ] Apply pattern to slop-detector skill

---
</example_output>

<success_criteria>
- [ ] Today's daily note exists (create if not)
- [ ] Session log appended with separator
- [ ] Specific outcomes documented (not just activities)
- [ ] Any created files linked with wikilinks
- [ ] User informed of what was logged
</success_criteria>

<companion_tool>
This skill creates data. **@vault-analyst** reads it.

After 2+ weeks of consistent logging, run `@vault-analyst` to discover:
- Recurring tasks you could automate
- Time-of-day patterns in your work
- Friction points that keep appearing
- Specific skills/agents to build

The more you log, the better the pattern detection.
</companion_tool>
