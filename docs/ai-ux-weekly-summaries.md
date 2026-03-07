# AI UX Vertical: Weekly Summaries

## Overview

This document defines the UX direction for AI-assisted weekly summaries in Solo.

Read this together with `docs/ai-ux-shared-foundations.md`.

## Why this vertical matters

Solo already provides weekly metrics, charts, recent activity, and export flows. What is still missing is synthesis.

AI should help users answer:

- what happened this week
- where time actually went
- what meaningful progress was made
- what needs attention next
- what should be shared with a client

## Desired outcome

The feature should turn tracked work into clear, useful narratives for:

- personal weekly review
- client-facing updates
- future project-specific recap flows

## Primary user problems

Even with reporting and exports, users still need to manually interpret the week:

- assemble the story from low-level entries
- decide which outcomes matter
- translate activity into client-ready language
- detect drift, imbalance, or under-logged work

## Primary user flow

The intended flow is:

1. the user reaches the end of the week and opens the dashboard or export flow
2. Solo shows whether the week's data is complete enough for a useful summary
3. the user chooses `Personal review` or `Client update`
4. AI produces an editable draft with visible grounding
5. the user adjusts sections, tone, or emphasis
6. the user copies, shares, or exports the refined version

This should feel like a review-and-communication workspace, not a black-box text generator.

## Core UX pattern

### Summary workspace with audience modes

The main pattern should be a summary workspace, not a single paragraph dropped onto the dashboard.

The workspace should clearly separate:

- `Personal review`
- `Client update`

Each mode should have distinct structure and tone.

## Solo placement guidance

This feature should build on Solo's existing dashboard and export flows.

### Recommended placement

- on the dashboard: a weekly-summary card below the primary stats
- in a dedicated weekly review view: the full editable summary workspace
- near export actions: an option to create a client-facing update draft
- later, on project-level surfaces: recap mode for long-running work

### Visual hierarchy for the weekly review screen

1. summary headline
2. editable narrative sections
3. supporting signals such as time distribution and exceptions
4. source-evidence drawer or expandable evidence rows

## UI component inventory

Use a small reusable set of patterns:

- `Weekly summary card`
- `Audience mode switcher`
- `Summary section block`
- `Section-level rewrite controls`
- `Source evidence drawer`
- `Completeness status banner`
- `Copy / share / export action bar`

## Recommended summary modes

### Personal review

This mode should be diagnostic and action-oriented.

Recommended section structure:

1. `Week at a glance`
2. `Where time went`
3. `What moved forward`
4. `What slipped or needs attention`
5. `Suggested focus for next week`

### Client update

This mode should be concise and outcome-oriented.

Recommended section structure:

1. `This week`
2. `Progress made`
3. `Current status`
4. `Next steps`
5. `Open questions or blockers`

Avoid defaulting to internal planning language, admin drift, or overly operational detail.

### Future project recap

For longer-running work, a project-specific mode should emphasize:

1. work completed
2. progress against goals
3. work still in motion
4. risks or dependencies
5. suggested next focus

## Content and copy guidance

### Lead with meaning, not raw metrics

Good opening:

- "This week focused primarily on Acme redesign delivery and stakeholder review, with smaller blocks spent on internal planning and admin follow-up."

Weak opening:

- "You worked 24.6 hours this week."

Hours should support the narrative, not replace it.

### Client-facing mode should emphasize outcomes

Good:

- "Reviewed wireframes, aligned on scope changes, and prepared the next round of revisions."

Less effective:

- "Spent 3h in meetings and 2h on revisions."

### Tone should stay calm and factual

Avoid exaggerated default language such as:

- "massive progress"
- "excellent week"
- "fully completed"

unless the user explicitly chooses that tone.

## Editing guidance

Users should be able to:

- rewrite one section at a time
- shorten a section
- make a section more client-friendly
- remove a bullet without regenerating everything
- switch audience without losing all edits

This is stronger than a single large `Regenerate` button.

## Source grounding guidance

Every summary should make it easy to inspect what it was based on.

Useful grounding cues:

- `Based on 9 entries across 3 projects`
- `Mostly drawn from Acme redesign work and internal planning tasks`
- `View supporting entries`

Users do not need technical citations, but they do need clear traceability.

## State matrix

| State | What the user sees | UX requirement |
| --- | --- | --- |
| Ready | Editable draft with evidence links | Keep narrative primary and evidence secondary |
| Loading | Skeleton for headline, sections, and action bar | Preserve layout and avoid jumpy content |
| Incomplete data | Warning banner before generation | Explain whether output is safer for internal or external use |
| Sparse week | Short, honest summary with limited scope | Do not force a grand narrative |
| Error | Inline failure plus retry | Offer raw export or manual fallback |
| Degraded | Partial summary with weak support in some sections | Be explicit about missing evidence |
| Edited | User changes preserved during tone or audience changes | Do not wipe the whole draft unless asked |

## Accessibility requirements

- headings and section actions must be keyboard reachable in logical order
- evidence drawers and expandable rows must be screen-reader clear
- copy actions cannot rely on hover-only controls
- reading width should stay comfortable and avoid wall-of-text layouts
- internal and external modes must be distinguished by more than color alone
- reduced-motion preferences should suppress nonessential generation animation

## Acceptance criteria

Design should not be signed off until:

- the user can clearly choose between personal and client-facing output
- each section can be edited or rewritten independently
- the summary shows what data it is grounded in
- the system warns clearly when the week's data is incomplete or too vague
- the user can move from draft to copy, share, or export without unnecessary extra steps
- empty, sparse, loading, degraded, and error states are all explicitly designed
- internal-review language does not appear by default in client mode

## Anti-patterns to avoid

- polished client output with no visible grounding
- mixing personal coaching and client-facing tone in one default draft
- forcing full regeneration for every minor change
- overloading the review view with too many charts and controls at once
- reducing the summary to hours instead of progress and priorities

## Suggested rollout order

1. personal weekly review draft
2. client-facing version of the weekly draft
3. project-specific recap mode
4. stronger tone controls and section-level refinements

## Success metrics

- more users complete a weekly review
- more summary drafts are edited and reused
- more client communication begins in Solo instead of outside tools
- users report better clarity on where time went and what to prioritize next
- time spent preparing weekly updates decreases

## Related

- `docs/ai-ux-shared-foundations.md`
- `docs/ai-ux-time-capture.md`
