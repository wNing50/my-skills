---
name: travel-plan-workbook
description: Use when Codex creates, edits, reviews, or adapts travel itinerary Excel workbooks, including day-by-day travel plans, route-map images, hotel and reservation research, closure-risk notes, budget sheets, cash/card estimates, or workbook formatting for trips.
---

# Travel Plan Workbook

## Core Rule

For a new travel plan, do not create or modify the workbook immediately. First inspect the source/template, confirm flight-day scope and timing, think through the trip, present a concise proposed itinerary and workbook approach, and get explicit user confirmation. Treat this confirmation as required even when the user provided dates and a template.

Never assume that a stated date range means every day is available for sightseeing. Before proposing a day-by-day itinerary, explicitly ask whether the range includes outbound and return flight days; ask the departure city, return destination, and the planned or estimated departure and arrival times for both flights. Estimate airport transfer, check-in, baggage, border-control, and time-zone effects. Mark arrival and departure days as partial by default until the user confirms otherwise.

For `.xlsx` authoring, prefer the standard workbook tool specified by the active environment. If it is unavailable, use another reliable local authoring method that can create a valid Excel workbook. Still create a new output file and perform the same structural and visual verification before delivery; do not stop solely because the preferred tool is unavailable.

## Italy-style Workbook Template

When a user requests the Italy-style travel workbook, use `assets/template.xlsx` as a read-only source. Copy it to a new output path before editing. Preserve its three-sheet structure, merged title areas, column widths, row heights, fills, and route-image cells; replace only destination-specific content, links, formulas, and route images. Never overwrite the retained template asset.

If the user asks only for advice, route rearrangement, attraction ideas, or a payment/cash estimate, answer directly without editing files unless they explicitly ask to update the workbook.

## Workflow

1. Inspect the workbook or template before planning. Identify sheet names, merged cells, images, hidden rows/columns, formulas, formatting, and current column order.
2. Load `references/workbook-pattern.md` when generating/editing workbook structure, route-map images, costs, hotels, reservations, or formatting.
3. Build a planning proposal before implementation:
   - Confirm dates, weekdays, whether the stated range includes the outbound and return flight days, departure city, return destination, planned or estimated flight times, and city sequence.
   - Estimate airport transfer, check-in, baggage, border-control, and time-zone effects; treat arrival and departure days as partial sightseeing days unless the user confirms they are not travel days.
   - Check attraction opening days, closure risks, reservation needs, timed-entry pressure, local holidays, and museum/rest-day patterns.
   - Evaluate route logic by day. Reduce backtracking; split multi-city days instead of drawing one long city-to-city walking route.
   - Estimate intensity using walking distance/steps, public transit segments, queues, and meal time.
   - Recommend lodging areas and hotel types according to safety, budget, transport, and user preferences.
   - Estimate costs with explicit include/exclude rules for flights, hotels, tickets, food, transit, cash, and card usage.
4. Ask for confirmation after the proposal. Do not generate or patch the workbook until the user confirms.
5. After confirmation, create a new output file instead of overwriting the source. Prefer `outputs/` and a descriptive versioned filename.
6. Preserve the template's visual style unless the user asks for redesign. Keep content readable without horizontal guessing: wrapped text, centered alignment where appropriate, stable widths, and row heights that fit route images.
7. Verify the generated workbook before final response: sheet names, column order, image positions, image overlap, blank route cells for no-attraction days, formulas, and visible used ranges.
8. Verify route images visually after generation. Do not trust HTTP success, file existence, or image dimensions alone; map tile providers may return rendered error pages such as `403`, `Access blocked`, or policy-warning tiles that still save as valid PNG files.

## Language

Use the user's working language for all workbook text: sheet names, column headers, cell content, route labels, notes, and cost categories. If the user does not specify a language, infer it from the source/template workbook. If no language can be inferred, default to English.

Route-map image text is workbook text too. Titles, stop labels, legends, and notes inside generated route images must use the same language as the workbook unless the user explicitly asks for bilingual or English map labels.

Keep internal concepts language-neutral. For example, the route image column is the "path/route" column conceptually; label it `Path` in English, `路径` in Chinese, or the appropriate localized term for the user's language.

## Workbook Standards

- Keep day number and tentative date as separate fields when dates are provisional.
- Put the route image column immediately after the attraction/scenic-spots column, using the user's language for the visible header.
- Put food/dining before lodging when the user has requested that ordering.
- Keep sources, hotels, and cost estimates as separate sheets unless the user asks to merge them.
- Include reservation/closure risk notes where useful: exact risky dates, weekly closures, and whether advance booking is recommended.

## Common Mistakes

- Generating the workbook before the user confirms the proposed trip.
- Copying a city route order from text without checking geographic order.
- Letting route images float over the next column; every image must stay inside the path/route column cell.
- Filling route images for days with no attractions.
- Generating route images with English titles or stop labels in a Chinese workbook, or vice versa.
- Accepting route-map PNGs only because they are non-empty; inspect the bitmap for blocked-tile/error-page text before inserting it.
- Treating a flight return day as a normal sightseeing day when time zone and airport transfer consume the day.
- Hardcoding Italy-specific assumptions or Chinese-only labels into a new destination workbook.
