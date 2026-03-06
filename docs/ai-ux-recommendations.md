# AI UX Recommendations

## Scope

This document focuses on two AI features that fit Solo best:

1. AI-assisted time capture
2. End-of-week summaries

It intentionally avoids technical architecture and implementation details. The goal is to define the right product behavior, placement, interaction model, and UX guardrails.

## Why these two features should come first

Solo already has the right product foundations for both features:

- a dedicated time-tracking workflow with timer, manual entry, calendar view, and time-entry review
- area and project structure that gives AI meaningful context
- dashboard reporting that already summarizes work by week, area, and project
- export flows that already package work for outside sharing

This means AI can improve the experience by reducing friction and adding interpretation, instead of introducing a completely new workflow.

---

## Research-informed UX principles

These recommendations are based on current UX guidance for AI products, especially around trust, reviewability, human control, and in-flow assistance.

### 1. Keep AI inside the workflow, not in a separate chat-first experience

For these features, the best UX is not a general-purpose assistant panel. AI should appear exactly where the user is already making decisions:

- on the time page
- after stopping a timer
- inside daily or weekly review moments
- next to summaries and exports

This lowers context switching and makes AI feel like a capability, not a second product.

### 2. Present drafts and suggestions, not hidden automation

Users should review, edit, accept, or dismiss AI output before it becomes part of their data or communication.

Use AI to create:

- draft time entries
- suggested project matches
- suggested descriptions
- draft weekly summaries
- draft client updates

Do not make AI act as if it knows the truth. It should help users decide faster.

### 3. Show why the system made a suggestion

Users trust AI more when it shows concrete signals instead of vague intelligence.

Good supporting context:

- "Based on your calendar event"
- "Similar to entries you logged last Thursday"
- "Most of this week's time was on Project X"
- "This summary is based on 12 tracked entries"

Bad supporting context:

- "AI confidence: 83%"
- "The model thinks..."

Concrete evidence is more useful than opaque scores.

### 4. Make every AI output easy to edit

Editable output is mandatory for both features.

Users should be able to:

- change the project before saving a suggested time entry
- edit generated descriptions inline
- remove a bullet from a weekly summary
- switch the tone of a client-facing summary
- regenerate only one section instead of the entire result

This keeps users in control and prevents the "all or nothing" feeling common in weak AI products.

### 5. Use progressive disclosure

Do not overwhelm users with AI reasoning or too many options up front.

Default view should be simple:

- suggested action
- short explanation
- clear primary action

Advanced detail can be hidden behind:

- "Why this suggestion?"
- "See source entries"
- "Adjust tone"
- "Review assumptions"

### 6. Separate internal and external output

Personal review and client communication are different jobs.

Internal outputs can be direct and diagnostic:

- what got neglected
- where time drifted
- which goals were missed

External outputs should be polished and outcome-oriented:

- what progressed
- what was completed
- what is next
- what input is needed

The UI should make this distinction obvious instead of mixing both voices together.

### 7. Calibrate trust carefully

AI can be helpful while still being wrong or incomplete.

For that reason:

- never imply certainty where data is weak
- never silently publish or save client-facing output
- avoid exaggerated language like "done", "complete", or "on track" unless the user confirms it
- clearly label AI-generated content as a draft

### 8. Measure usefulness, not novelty

The right success bar is behavioral:

- fewer unlogged hours
- faster entry completion
- fewer blank descriptions
- more weekly reviews completed
- more summary drafts actually edited and reused

Not:

- total clicks on the AI button
- prompt count
- time spent playing with the feature

---

## Feature 1: AI-assisted time capture

### Product goal

Reduce the effort required to create complete, accurate time entries.

The feature should help users remember what happened, classify it correctly, and describe it clearly without forcing them to reconstruct their day manually.

### The user problems to solve

The current workflow is already efficient, but users still need to do the final mental work:

- remember unlogged work blocks
- choose the right project
- write a useful description
- reconcile tracked time with calendar activity
- clean up vague entries before the week ends

AI should remove that recall burden.

### Recommended UX approach

### Primary pattern: suggestion cards, not freeform chat

The core pattern should be compact suggestion cards embedded inside the time workflow.

Each card should include:

- proposed project
- proposed duration or time window
- proposed description
- short reason for the suggestion
- actions such as `Accept`, `Edit`, and `Dismiss`

This is better than sending users into a chat box because it keeps the task concrete and fast.

### Suggested surfaces

#### 1. Post-event or post-activity suggestion

Best placement:

- near the calendar/time view
- after the user visits the time page
- after a clear event boundary

Ideal prompt style:

- "Log this as work?"
- "This looks like a missing entry"
- "Add a draft from this meeting?"

The user should be able to accept it in one tap or open it for editing.

#### 2. Timer stop enhancement

When the user stops the timer, that is a perfect moment for lightweight AI help.

Recommended behavior:

- keep the current fast stop flow
- improve the description only if needed
- suggest a clearer entry title if the input is empty or vague
- never block save behind extra AI interaction

The timer experience should remain fast. AI should polish the result, not slow it down.

#### 3. End-of-day catch-up panel

This should be the most valuable review pattern.

A small daily review panel can answer:

- "What likely still needs logging today?"
- "Which entries need clearer descriptions?"
- "Which calendar events appear untracked?"

This panel should support batch behavior:

- accept multiple draft entries
- dismiss obvious false positives
- open one draft in edit mode

Batch review is important because catch-up is usually a cleanup task, not a one-entry task.

#### 4. Weekly gap check

Before the week ends, the product should offer a gentle audit:

- missing time blocks
- suspiciously blank or generic descriptions
- recurring work that usually appears but is absent this week

This is especially useful on Fridays and makes weekly summaries better automatically.

### Solo-specific placement directions

To fit the current product structure, this feature should be anchored to the existing time page rather than introduced as a global assistant.

Recommended placement:

- below the time-page header: a lightweight review strip for missing-entry suggestions
- beside or beneath the quick timer: description improvement and post-stop polish
- within the day or week calendar context: event-linked suggestions and gap prompts
- above the time-entry list: a daily catch-up module for unresolved drafts

Priority order for visual emphasis:

1. timer-adjacent help
2. daily catch-up review
3. calendar-linked suggestions
4. weekly audit layer

This keeps the feature close to the current places where users already select projects, review days, and save entries.

### Recommended interaction design

### Keep suggestions highly structured

Each suggestion should feel like a nearly complete draft, not a vague recommendation.

Good example:

- Project: `Acme Website Refresh`
- Duration: `1h 30m`
- Description: `Client review call and follow-up actions`
- Reason: `Matches your 10:00 AM calendar event and similar entries from the last two weeks`

Weak example:

- "Would you like help logging time?"

The stronger the structure, the lower the cognitive load.

### Always provide an immediate low-friction action

The best primary actions are:

- `Accept`
- `Accept and edit`
- `Dismiss`

Avoid making the user open a modal just to take the obvious action.

### Use editing as a refinement layer, not the default path

If users constantly need to edit every suggestion, the feature will feel noisy.

The product goal is:

- accept when right
- edit when close
- dismiss when wrong

That balance matters.

### Support partial acceptance

Some suggestions will be roughly right but need one change.

Allow users to:

- change the project only
- shorten the duration
- replace the description
- merge or split a suggestion mentally without friction

Do not require full regeneration every time.

### Recommended content design

### Use explicit draft language

Preferred labels:

- `AI draft`
- `Suggested entry`
- `Draft description`
- `Review before saving`

Avoid:

- `Captured automatically`
- `We logged this for you`

### Keep reasoning short and specific

Best reasoning style:

- "From your calendar"
- "Similar to recent entries"
- "Matches your timer activity"

Reasoning should build trust without cluttering the UI.

### Empty, edge, and failure states

### When the system is unsure

If context is weak, the feature should become more conservative.

Better behavior:

- "We found a possible work block. Please confirm the project."

Worse behavior:

- inventing a very specific project or description

### When there are no good suggestions

Say so clearly:

- "No strong suggestions right now"
- "Nothing missing detected for today"

Silence is often better than low-quality AI output.

### When a suggestion is dismissed

Do not immediately re-show the same suggestion in a slightly different form.

Dismissal should feel respected.

### Anti-patterns to avoid

- adding a floating AI chat widget to the time page as the main interface
- forcing users to type prompts for common capture actions
- auto-saving AI entries without review
- showing fake precision or unexplained confidence numbers
- interrupting timer stop flow with too much review friction
- creating too many low-quality suggestions and training users to ignore the feature

### Recommended rollout order

1. Suggest clearer descriptions for timer and manual entries
2. Add missing-entry suggestions based on existing activity and calendar context
3. Add daily catch-up review
4. Add weekly gap audit and smarter batch review

This order improves quality and trust before introducing heavier suggestion volume.

### Success criteria

- time to complete an entry decreases
- percentage of entries with meaningful descriptions increases
- number of end-of-day or end-of-week catch-up actions increases
- acceptance rate remains healthy without high dismissal fatigue
- users report that they backfill less often on Fridays

---

## Feature 2: End-of-week summaries

### Product goal

Turn tracked work into clear, useful weekly narratives for both the freelancer and the client.

The feature should help users understand their week, communicate progress, and decide what deserves attention next.

### The user problems to solve

The product already offers metrics and exports, but users still need to interpret the week manually.

They still need to answer:

- What did I really spend the week on?
- What meaningful progress happened?
- What should I tell the client?
- Where did I drift from plan?
- What should next week focus on?

AI should turn raw activity into insight and communication-ready drafts.

### Recommended UX approach

### Primary pattern: summary workspace with audience modes

The best pattern is not a single paragraph dropped onto the dashboard.

Instead, use a summary workspace with clear audience selection:

- `Personal review`
- `Client update`

These two modes should feel distinct in tone and structure.

### Suggested surfaces

#### 1. Weekly summary card on the dashboard

This is the trigger surface, not the full experience.

The card should answer:

- whether the weekly summary is ready
- whether tracked data looks complete enough
- what type of summary the user can generate next

Primary actions:

- `Review weekly summary`
- `Create client update`

#### 2. Dedicated weekly review view

This should be the main summary experience.

It should combine:

- summary narrative
- top wins
- time distribution
- exceptions or risks
- next-week recommendations
- source activity that supports the narrative

This is important: the user should be able to see both the synthesized narrative and the underlying work record in one place.

#### 3. Export-adjacent summary entry point

When a user is already exporting work, that is a high-intent moment for communication.

Offer a summary option alongside raw export behavior:

- raw task export
- polished client summary draft
- concise internal debrief

This keeps AI attached to an existing value moment instead of inventing a new one.

### Solo-specific placement directions

This feature should build on Solo's existing dashboard and export behaviors, not replace them.

Recommended placement:

- on the dashboard: a weekly-summary card below the primary stats as the main entry point
- inside a dedicated weekly review screen: the full summary workspace with editable sections
- near export actions: an option to convert tracked work into a client-facing update draft
- optionally on project detail surfaces in the future: project-specific recap mode

Recommended visual hierarchy for the weekly review screen:

1. summary headline
2. editable narrative sections
3. supporting signals such as time distribution and exceptions
4. source-entry review drawer or expandable evidence rows

The summary should feel like a decision-and-communication workspace, not just another dashboard chart block.

### Recommended summary structure

### Personal review format

The internal weekly review should be sharp and diagnostic.

Recommended sections:

1. `Week at a glance`
2. `Where time went`
3. `What moved forward`
4. `What slipped or needs attention`
5. `Suggested focus for next week`

This format makes the summary actionable rather than merely descriptive.

### Client update format

The client version should be concise and outcome-oriented.

Recommended sections:

1. `This week`
2. `Progress made`
3. `Current status`
4. `Next steps`
5. `Open questions or blockers`

Avoid overexposing internal planning language, time-allocation concerns, or administrative drift.

### Project-specific review format

For longer-running work, support a project-level weekly narrative:

1. `Work completed`
2. `Progress against goals`
3. `Work still in motion`
4. `Risks or dependencies`
5. `Suggested next focus`

### Recommended interaction design

### Make the summary editable section by section

Users should be able to adjust:

- one section at a time
- tone for external sharing
- length
- emphasis

Examples of useful controls:

- `Shorter`
- `More client-friendly`
- `Focus on outcomes`
- `Rewrite this section`
- `Remove this bullet`

This creates a much stronger experience than one giant "Regenerate" button.

### Link the summary back to source evidence

This is one of the most important trust patterns.

Each meaningful section should let the user inspect what it was based on:

- relevant entries
- related projects
- time distribution for the week
- unusually active or inactive areas

Users do not need full technical citations, but they do need traceability.

Good examples:

- "Based on 9 entries across 3 projects"
- "Mostly drawn from Acme redesign work and internal planning tasks"
- `View supporting entries`

### Make completeness visible before generation

A weekly summary is only as strong as the underlying time log.

Before generating, show signals like:

- `Tracking completeness looks strong`
- `Some work may be missing this week`
- `3 entries have generic descriptions`

This helps users understand whether the output is ready for internal review only or safe enough for client-facing polishing.

### Allow audience switching without starting over

If a user likes the internal draft, they should be able to turn it into a client-facing version without rebuilding from scratch.

The system should preserve user edits whenever possible.

### Recommended content design

### Lead with meaning, not metrics

A good summary should start with what happened, not with raw hours.

Good opening:

- "This week focused primarily on Acme redesign delivery and stakeholder review, with smaller blocks spent on internal planning and admin follow-up."

Weaker opening:

- "You worked 24.6 hours this week."

Hours matter, but they should support the story rather than replace it.

### Emphasize outcomes over activity in client-facing mode

Client summaries should convert low-level work logs into progress language.

Good:

- "Reviewed wireframes, aligned on scope changes, and prepared the next round of revisions."

Less effective:

- "Spent 3h in meetings and 2h on revisions."

### Keep the tone calm and factual

Avoid exaggerated language such as:

- "massive progress"
- "excellent week"
- "fully completed"

unless the user explicitly chooses that tone.

### Empty, edge, and failure states

### Sparse week

If the week has little activity, the product should not force a grand narrative.

Preferred behavior:

- produce a short, honest summary
- highlight that tracked input is limited
- offer to focus on project or client slices instead

### Weak descriptions

If many entries are vague, the system should say so and encourage cleanup before external sharing.

Best behavior:

- "This draft is suitable for internal review, but two entries are too vague for a client-ready update."

### Mixed-signal week

If the data implies conflicting stories, the summary should stay careful and specific.

The system should avoid acting more certain than the evidence allows.

### Anti-patterns to avoid

- presenting a polished client summary with no visible grounding
- mixing personal coaching and client-ready language in one draft
- making users regenerate the entire summary for every small change
- overloading the summary with charts, controls, and AI explanations all at once
- overfitting to hours instead of explaining progress and priorities

### Recommended rollout order

1. Personal weekly review draft
2. Client-facing version of the weekly draft
3. Project-specific summary mode
4. Stronger editing controls and tone variants

This order builds trust on internal use before asking users to share externally.

### Success criteria

- more users complete a weekly review
- summary drafts are edited and reused rather than ignored
- more client communication starts from Solo instead of outside tools
- users report better clarity on where time went and what to prioritize next
- users spend less time manually assembling weekly updates

---

## Cross-feature recommendations

These two features reinforce each other and should be positioned that way.

Better time capture creates:

- more complete weeks
- better descriptions
- more trustworthy summaries

Better summaries then reinforce the value of good capture by showing users why clean entries matter.

This is a strong product loop:

1. AI helps users capture better data
2. AI turns that data into insight and communication
3. users see the value of maintaining better data

---

## MVP recommendation

If only one near-term UX package is possible, prioritize:

1. AI draft descriptions and missing-entry suggestions on the time page
2. a weekly review screen with a personal summary first

That sequence improves the source data before expanding into external communication.

---

## Best-practice source notes

The UX directions in this document are informed by current research and industry guidance emphasizing human review, in-flow AI assistance, transparent draft behavior, and source-grounded summaries.

Useful references:

- Nielsen Norman Group on generative UI, trust, and hallucination risks:
  - https://www.nngroup.com/articles/generative-ui/
  - https://www.nngroup.com/articles/ai-magic-8-ball/
- Atlassian on AI UX patterns and embedded workflow assistance:
  - https://www.atlassian.com/blog/developer/ai-user-experience-patterns
  - https://www.atlassian.com/blog/design/ai-adoption-through-trust-rachel-shepard
- Google Cloud on design considerations for generative AI:
  - https://cloud.google.com/blog/products/ai-machine-learning/design-considerations-for-gen-ai/
- Human-in-the-loop workflow guidance:
  - https://humanops.io/blog/human-in-the-loop-guide
  - https://arafattehsin.com/the-pragmatic-guide-to-human-in-the-loop-ai/
