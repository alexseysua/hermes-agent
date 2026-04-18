# Questioning Methodology

Reference for requirement elicitation before planning or execution.

## When to Ask
- Before planning: clarify scope, constraints, success criteria
- During discussion: resolve ambiguity in requirements
- Before execution: confirm architectural decisions with significant tradeoffs

## When to STOP Asking
- User said "just do it", "use your judgment", or similar
- Question would only change cosmetic details (color, naming)
- Answer is derivable from existing context or codebase patterns
- Already asked 5+ questions in current topic
- Repeating a question already answered earlier in conversation

## Feature-Type-Specific Probes

### Visual / UI
- Layout preference: cards vs table vs list?
- Density: compact vs comfortable spacing?
- Empty states: what to show when no data?
- Loading states: skeleton, spinner, or progressive reveal?
- Responsive behavior: stack, hide, or resize on small screens?

### API / Backend
- Response format: JSON shape, pagination style (cursor vs offset)?
- Error handling: error codes, retry behavior?
- Authentication: public, session, or token-based?
- Rate limiting: expected request volume?
- Backward compatibility: breaking changes acceptable?

### Data / Database
- Volume expectations: ~10 rows vs ~10M rows?
- Query patterns: read-heavy or write-heavy?
- Consistency requirements: eventual vs strong?
- Migration strategy: online (zero-downtime) vs offline?

### Infrastructure / DevOps
- Target environment: cloud provider, existing constraints?
- Scaling: horizontal (more instances) vs vertical (bigger instance)?
- Monitoring: what metrics matter?
- Rollback strategy: feature flag, blue/green, or manual?

## Question Quality Rules
1. Each question must be **answerable** — not abstract philosophy
2. Each question must **affect implementation** — skip pure curiosity
3. **Offer options** where possible — don't make user think from scratch
4. **Group related questions** — ask 3-5 at once, not one at a time
5. **State your default** — "I'll use X unless you prefer Y"
