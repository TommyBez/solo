# Shared AI UX Foundations

## Overview

This document captures the shared UX foundations for Solo's AI features.

Use it together with:

- `docs/ai-ux-time-capture.md`
- `docs/ai-ux-weekly-summaries.md`

The goal is to define the common interaction rules, trust model, accessibility expectations, and design QA standards that should apply across both verticals.

## Audience

This document is for:

- product designers
- product managers
- founders reviewing scope and quality
- engineers preparing implementation from a UX handoff

## Product assumptions

These recommendations assume Solo's current product model:

- time is tracked against projects
- projects sit inside areas
- clients and workspace context matter for interpretation
- Google Calendar is optional context, not the source of truth
- AI output must remain user-reviewable before it is saved or shared

## What success looks like

The goal is not to add "AI features" as decoration. The goal is to produce visible user value:

- users log time faster
- fewer entries are missing or vague
- weekly review becomes a repeatable habit
- client updates take less effort to prepare
- the product feels more helpful without feeling less trustworthy

## Shared UX principles

### 1. Keep AI inside existing workflows

AI should appear where users already make decisions:

- on the time page
- in end-of-day or end-of-week review moments
- near export and summary actions

Avoid introducing a chat-first workflow for tasks that are already structured.

### 2. Present drafts and suggestions, not hidden automation

AI should create:

- draft time entries
- suggested descriptions
- suggested project matches
- draft weekly summaries
- draft client updates

Users must be able to review, edit, accept, or dismiss output before it becomes part of their data or communication.

### 3. Show concrete reasons, not abstract intelligence

Good reasoning is specific and short:

- "Based on your calendar event"
- "Similar to recent entries"
- "Based on 12 tracked entries"

Avoid vague or misleading language such as:

- "AI confidence: 83%"
- "The model thinks..."

### 4. Make every AI output easy to edit

Both verticals should support lightweight editing instead of forcing full regeneration.

Users should be able to:

- edit a suggested time entry inline
- rewrite one summary section without losing the rest
- switch audience or tone without restarting

### 5. Use progressive disclosure

Default view should show:

- the suggested action
- a short explanation
- one obvious primary action

Advanced detail can sit behind secondary affordances such as:

- `Why this suggestion?`
- `View supporting entries`
- `Adjust tone`
- `Review assumptions`

### 6. Separate internal and external outputs

Personal review and client communication are different jobs.

Internal output can be more diagnostic:

- what was neglected
- where time drifted
- what needs attention

External output should be polished and outcome-oriented:

- what progressed
- what was completed
- what happens next
- what input is needed

### 7. Calibrate trust carefully

AI can be helpful and still be incomplete.

Shared guardrails:

- never imply certainty where data is weak
- never silently publish or save client-facing output
- clearly label AI-generated content as a draft or suggestion
- avoid exaggerated claims unless the user explicitly confirms them

### 8. Measure usefulness, not novelty

Meaningful success indicators:

- fewer unlogged hours
- faster entry completion
- fewer blank descriptions
- more weekly reviews completed
- more summary drafts edited and reused

Low-value vanity metrics:

- prompt count
- clicks on the AI label
- time spent exploring the feature

## Shared interaction rules

### Primary action discipline

Each view or card should have one obvious primary action.

Avoid:

- competing CTAs in the same local surface
- oversized action bars with equal visual weight
- burying the obvious next step behind a menu

### Manual fallback is mandatory

If AI is unavailable or wrong, users must still be able to complete the task with the normal product workflow.

### Respect dismissals

If a user dismisses an AI suggestion, do not immediately re-surface the same suggestion in a slightly different form.

## Shared state coverage

Every AI surface should explicitly define:

- loading
- empty
- error
- degraded
- success / ready

Optional state handling:

- dismissed
- incomplete data
- sparse evidence

The default happy path is not enough for signoff.

## Shared accessibility requirements

Use these as non-negotiable design constraints:

- meet WCAG 2.2 AA expectations for focus visibility, contrast, and keyboard access
- keep interactive targets at least 24x24 CSS px
- never rely on color alone for AI state or trust signals
- support reduced-motion preferences for AI animations or transitions
- ensure all important actions work without hover-only interaction
- use plain-language copy and avoid AI jargon
- avoid redundant entry when the product already knows the value

## Shared content rules

- label AI output as `Draft`, `Suggested`, or equivalent
- lead with meaning before technical detail
- use active voice
- keep reasoning lines short and evidence-based
- write for non-ML users

## Shared design QA checklist

### Interaction quality

- one primary action per view or card
- immediate feedback after accept, dismiss, rewrite, and copy actions
- clear fallback path when AI output is wrong

### State coverage

- loading state matches final information architecture
- empty state has a clear next step
- error state has retry or fallback
- degraded state explains limitations plainly

### Accessibility

- keyboard flow works end to end
- focus is visible and never obscured
- color is never the only signal
- copy remains understandable without AI literacy

### Solo fit

- AI lives inside existing routes and workflows
- the time page stays fast for expert users
- weekly review enhances the dashboard instead of replacing it
- Google Calendar remains optional context

## Recommended rollout order

Across both verticals, the best sequence is:

1. improve source-data quality first
2. then add review and communication layers

That means:

1. AI-assisted time capture
2. personal weekly review
3. client-facing summary output

## Related

- `docs/ai-ux-time-capture.md`
- `docs/ai-ux-weekly-summaries.md`

## Source notes

These foundations are informed by current UX guidance emphasizing human review, in-flow AI assistance, transparent draft behavior, and source-grounded summaries.

Useful references:

- Nielsen Norman Group on generative UI and trust
- Atlassian on embedded AI workflow patterns
- Google Cloud on generative AI design considerations
- human-in-the-loop workflow guidance
