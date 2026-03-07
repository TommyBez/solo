# AI UX Vertical: Time Capture

## Overview

This document defines the UX direction for AI-assisted time capture in Solo.

Read this together with `docs/ai-ux-shared-foundations.md`.

## Why this vertical matters

Time capture is the highest-frequency workflow in Solo. Users already:

- run a quick timer
- add manual time entries
- review entries by day
- compare tracked work against calendar context

AI should improve this workflow by reducing recall burden, not by replacing user control.

## Desired outcome

The feature should help users:

- remember missing work blocks
- choose the correct project faster
- write more useful descriptions
- clean up the week before summaries are generated

## Primary user problems

Without assistance, users still need to do the last-mile mental work:

- remember what was not logged
- reconstruct the project from memory
- turn vague activity into a useful description
- reconcile meetings and tracked work

## Primary user flow

The intended flow is:

1. the user lands on the time page
2. Solo surfaces one or more draft suggestions in context
3. the user accepts, edits, or dismisses the draft
4. saved entries immediately improve reporting and summary quality

This should feel like a faster version of the existing workflow, not a new one to learn.

## Core UX pattern

### Suggestion cards, not chat

The main unit of interaction should be a compact suggestion card.

Each card should contain:

- proposed project
- proposed duration or time window
- proposed description
- short evidence line
- `Accept`, `Accept and edit`, and `Dismiss` actions

Weak pattern:

- "Would you like AI help?"

Strong pattern:

- `Acme Website Refresh`
- `1h 30m`
- `Client review call and follow-up actions`
- `Based on your 10:00 AM calendar event and similar recent entries`

## Solo placement guidance

This feature should stay on the time page and around existing time-entry actions.

### Recommended placement

- below the time-page header: lightweight review strip for missing-entry suggestions
- beside or beneath the quick timer: post-stop description improvement
- inside the day or week calendar context: event-linked suggestions and gap prompts
- above the time-entry list: daily catch-up module for unresolved drafts

### Visual priority

1. timer-adjacent help
2. daily catch-up review
3. calendar-linked suggestions
4. weekly audit layer

## UI component inventory

Use a small reusable set of patterns:

- `Suggestion card`
- `Evidence line` or `Reason chip`
- `Accept / Accept and edit / Dismiss` action row
- `Daily catch-up module`
- `Weekly audit banner`
- `Inline description enhancer`

## Recommended feature surfaces

### 1. Timer stop enhancement

This is the lowest-friction entry point.

Recommended behavior:

- keep the current fast stop flow
- improve the description only if needed
- suggest a clearer label when the entry is blank or vague
- never block save behind extra review steps

### 2. Post-event suggestion

Use AI to surface likely time-entry drafts after meaningful activity boundaries.

Good prompt style:

- "Log this as work?"
- "This looks like a missing entry"
- "Add a draft from this meeting?"

### 3. End-of-day catch-up

This should be the highest-value review surface.

It should answer:

- what likely still needs logging today
- which entries are too vague
- which calendar events appear untracked

This surface should support batch behavior:

- accept several drafts quickly
- dismiss obvious false positives
- edit a single draft in place

### 4. Weekly gap check

Before the week ends, Solo should flag:

- likely missing time blocks
- suspiciously blank descriptions
- recurring work that normally appears but is absent

This is valuable because it improves the quality of weekly summaries downstream.

## Content and copy guidance

### Preferred labels

- `AI draft`
- `Suggested entry`
- `Draft description`
- `Review before saving`

### Avoid

- `Captured automatically`
- `We logged this for you`
- unexplained confidence scores

### Reasoning lines should be short

Good examples:

- `From your calendar`
- `Similar to recent entries`
- `Matches your timer activity`

## State matrix

| State | What the user sees | UX requirement |
| --- | --- | --- |
| Default | One or more draft suggestions | One clear primary CTA per card |
| Loading | Placeholder cards matching final layout | Do not shift nearby content |
| Empty | "No strong suggestions right now" | Avoid decorative empty AI chrome |
| Unsure | Low-confidence draft asking for confirmation | Ask for missing input instead of guessing |
| Error | Short inline error plus retry or manual fallback | Never trap the user in the AI flow |
| Degraded | Limited suggestion quality | Explain what context is missing in plain language |
| Dismissed | Suggestion disappears for that review window | Respect user intent |

## Accessibility requirements

- all suggestion actions must be keyboard reachable
- focus order must remain logical between timer, suggestions, and manual entry
- target sizes must meet WCAG 2.2 guidance
- color cannot be the only indicator of AI state or urgency
- reduced-motion preferences should suppress nonessential animation

## Acceptance criteria

Design should not be signed off until:

- a user can accept a good suggestion in one obvious step
- a user can edit project, description, or duration without starting over
- dismissing a suggestion removes it from the immediate review flow
- a manual-entry fallback is always available
- empty, loading, error, degraded, and unsure states are all explicitly designed
- the feature works even when Google Calendar is not connected

## Anti-patterns to avoid

- floating AI chat as the primary time-capture interface
- forcing prompt-writing for common capture actions
- auto-saving AI-created entries without review
- surfacing too many weak suggestions and training users to ignore the feature
- slowing down expert timer users with mandatory AI review

## Suggested rollout order

1. description improvement for timer and manual entries
2. missing-entry suggestions using existing activity and calendar context
3. daily catch-up review
4. weekly gap audit

## Success metrics

- entry completion time decreases
- blank or vague descriptions decrease
- catch-up review usage increases
- acceptance rate stays healthy without high dismissal fatigue
- users report less Friday backfilling

## Related

- `docs/ai-ux-shared-foundations.md`
- `docs/ai-ux-weekly-summaries.md`
