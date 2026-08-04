---
name: polishing-game-reviews
description: Use when Codex edits, polishes, proofreads, expands, rewrites, or gives revision suggestions for game reviews, game criticism, player impressions, Steam-style comments, video/article scripts, Chinese game-review drafts, player impressions, review notes, or review drafts where the user wants style-preserving polish instead of a new voice.
---

# Polishing Game Reviews

## Core Principle

Preserve the writer's voice, stance, rhythm, and level of subjectivity. Treat the draft as the user's writing, not raw material for a new review.

Default to light polish: smoother wording, clearer transitions, corrected punctuation, reduced repetition, and more precise game-review vocabulary. Do not make the text sound more formal, media-like, promotional, academic, sarcastic, or decisive unless the user asks.

## Workflow

1. Read the latest available draft before editing, especially when working in a file. Treat any user edits made after the previous pass as authoritative.
2. Identify the original style before editing: casual or formal, sharp or gentle, dense or conversational, enthusiastic or reserved, personal or analytical.
3. Keep the user's judgments and uncertainty intact. Do not change ratings, recommendations, emotional intensity, or the balance of praise and criticism.
4. Make the smallest useful edit. Prefer sentence-level polishing over paragraph-level rewriting.
5. Preserve concrete examples, game names, platform names, mechanics, and genre terms. If a term seems wrong or ambiguous, flag it instead of silently replacing it.
6. If the user asks for expansion, added arguments, stronger structure, extra examples, title options, scoring, or a longer review, discuss the direction first. Ask what points, audience, length, tone, and spoiler boundary they want before expanding.
7. After the user confirms an expansion direction, expand only within that direction. Add connective tissue, brief explanations, and development of points already present in the draft; do not introduce unrelated review sections or new claims.
8. If substantial improvement requires adding new claims or examples, ask before adding them.

## Allowed Edits

- Fix typos, punctuation, spacing, and inconsistent capitalization such as `boss` vs `Boss`.
- Smooth awkward wording while preserving sentence attitude.
- Clarify references when the meaning is already present.
- Trim repeated words or merge obviously redundant phrases.
- Adjust transitions so praise, criticism, and conclusion read naturally.
- After expansion direction is confirmed, turn terse bullets or short impressions into fuller paragraphs while preserving the same ordering, verdict, and personal voice.
- Offer optional notes after the polished version when a choice may affect style.

## Do Not

- Do not overwrite the user's voice with a generic professional-review style.
- Do not add new plot, mechanic, performance, monetization, or design claims without permission.
- Do not intensify praise or criticism unless requested.
- Do not turn personal impressions into objective verdicts.
- Do not add spoilers, scores, recommendation labels, section headings, or marketing hooks unless requested.
- Do not expand a short draft into a long-form review before discussing the expansion with the user.

## Response Pattern

For a direct polish request, return the polished text first. Keep notes brief or omit them when the edit is straightforward.

For expansion or major rewrite requests, ask a concise question before editing, for example:

```text
I can expand it, but let me confirm the direction first: should I preserve the current personal-impression voice, or make it closer to a structured formal review? What target length do you want, and should I avoid spoilers?
```

After the user chooses a direction, proceed with the edit and mention the chosen direction briefly. When editing a file, read the current file contents again before patching.

## Common Mistakes

- Expanding from an older draft and accidentally deleting user edits made between turns.
- Treating "expand" as permission to add new review categories, claims, spoilers, or scores.
- Making a player-impression draft sound like a generic media review after the user asked to preserve voice.
- Reordering praise and criticism so the user's argument feels different.

## Quick Check

Before finalizing, compare the draft and revision:

- Same voice?
- Same opinion?
- Same intensity?
- No invented claims?
- No expansion without discussion?
- Latest user edits preserved?
