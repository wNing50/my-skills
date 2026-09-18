---
name: xiaohongshu-carousel
description: Create or revise multi-page Xiaohongshu carousel posts that combine concise Chinese copy with coherent vertical visual assets. Use for educational, travel, guide, or story-led carousel production; not for a single standalone poster.
---

# Xiaohongshu Carousel

Create a publishable vertical carousel in which every page earns its place: the first image pulls attention, the middle pages make one idea easy to retain, and the final page leaves a usable takeaway or a natural stopping point.

## Start With The Story

- Identify audience, intended reader action, slide count, title, working language, factual-sensitivity level, and whether the user wants a plan, copy, images, or a finished asset set.
- Build a slide outline before making images. Give every slide one job: hook, orientation, chronology, comparison, explanation, practical application, or close.
- Keep cover text short and exact. For a knowledge post, favor a clear topic or promise over a marketing-style headline.
- Write in the user's requested register. Avoid generic second-person filler when the user asks for natural, conversational copy.
- When historical, geographic, medical, legal, religious, or other factual claims are central, identify the few facts that need deliberate verification before they become image text.

## Visual System

- Choose one repeatable visual language across the set: medium, line quality, palette, typography, annotation style, and card treatment. Vary composition by page purpose so the set does not look like the same poster repeated.
- Match the visual to the page role:
  - Cover: one recognizable subject and ample negative space; no explanatory cards.
  - Geography: use a geographically credible map or diagram; avoid decorative imagery that obscures spatial relationships.
  - Timeline: use a visible chronological path and compact, comparable modules.
  - Comparison: use matched columns or panels with the same visual scale.
  - Transition: make before/after differences immediately legible through composition, labels, or restrained color contrast.
  - Place or lifestyle page: include human-scale activity when it helps the story; do not add figures merely as decoration.
- Generate raster images for atmospheric, architectural, place, and people content. Do not ask an image model to produce factual Chinese copy, dates, counts, maps, or small labels.
- Treat generated images as visual bases. Add controlled Chinese copy, directional annotations, icons, counts, and corrections afterward in SVG, HTML/CSS, or another editable overlay format.
- If a model cannot reliably depict a factual visual detail, state the fact in controlled text and avoid relying on the illustration alone.

## Production Workflow

1. Inspect existing drafts, source images, and output folders. Preserve user-approved work and any pre-existing version scheme.
2. Write or update the copy draft before final rendering. Keep each page scannable: one title, a short lead, then only the supporting text needed for that page.
3. Generate a visual base with no text or logos. Specify the output ratio, composition, empty areas for overlays, visual style, factual constraints, and explicit exclusions.
4. Inspect the bitmap before accepting it. Check subject identity, geography/perspective, factual visual cues, visual density, human proportions, unwanted text, and usable negative space.
5. Save approved visual bases separately from final composites. Keep rejected or historical candidates according to the project convention; do not silently delete them.
6. Add final editable overlays. Use real line breaks, stable card dimensions, sufficient contrast, and annotation lines that terminate on their intended subject.
7. Render each editable source to the final publishable PNG and inspect the rendered file, not merely the source markup.
8. Review the carousel in swipe order. Resolve duplicated compositions, abrupt style changes, repetitive architecture shots, empty pages, text overflow, and weak endings.

## Asset Management

- Never overwrite an approved original unless the user explicitly asks for replacement.
- Put revisions in a clear sibling folder or versioned filename. Keep visual bases and editable overlay sources beside the final PNGs where that supports future iteration.
- Follow the user's requested folder naming and ordering. If none exists, use descriptive, zero-padded page filenames such as `topic-01-cover.png`.
- Do not commit changes unless the user explicitly asks.

## Verification

Before delivery, verify all final PNGs at their actual display aspect ratio. Confirm:

- text is readable, within bounds, and does not collide with visual subjects;
- every title matches the approved copy exactly;
- factual numbers, dates, names, directions, and location relationships are correct;
- map labels and connectors point to the intended places;
- the cover remains legible at thumbnail size;
- page order tells a complete story without relying on off-page explanation.

Read [references/page-patterns.md](references/page-patterns.md) when planning the carousel or when a page needs a different composition from the rest of the set.
