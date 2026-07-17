---
name: travel-plan-workbook
description: Use when Codex creates, edits, reviews, or adapts travel itinerary Excel workbooks, including day-by-day travel plans, route-map images, hotel and reservation research, closure-risk notes, budget sheets, cash/card estimates, or workbook formatting for trips.
---

# Travel Plan Workbook

## Core Rule

For a new travel plan, do not create or modify the workbook immediately. First inspect the source/template, confirm flight-day scope and timing, think through the trip, present a concise proposed itinerary and workbook approach, and get explicit user confirmation. Treat this confirmation as required even when the user provided dates and a template.

Never assume that a stated date range means every day is available for sightseeing. After inspecting the template, collect all material planning inputs in one consolidated intake message: dates/weekdays, whether outbound and return days are included, departure city, return destination, airport and estimated flight times, travelers, city sequence/must-sees, pace, budget, hotel constraints, and preferred intercity-transfer window (`morning`/`afternoon`/`evening`). Do not ask these items one by one across multiple turns. Ask a follow-up only when a missing answer would materially change the route or flight-day feasibility.

Estimate airport transfer, check-in, baggage, border-control, and time-zone effects. Mark arrival and departure days as partial by default until the user confirms otherwise. Treat intercity transport as itinerary time and cost, not a footnote: calculate door-to-door duration, transfers, and a two-person or per-person fare for each city change before proposing the route.

Do not require or create a `.worktrees`/Git worktree for travel-workbook generation. Work in the user's current workspace unless the user explicitly requests isolation.

For `.xlsx` authoring, prefer the standard workbook tool specified by the active environment. If it is unavailable, use another reliable local authoring method that can create a valid Excel workbook. Still create a new output file and perform the same structural and visual verification before delivery; do not stop solely because the preferred tool is unavailable.

## Italy-style Workbook Template

When a user requests the Italy-style travel workbook, use `assets/template.xlsx` as a read-only source. Copy it to a new output path before editing. Preserve its three-sheet structure, merged title areas, column widths, row heights, fills, and route-image cells; replace only destination-specific content, links, formulas, and route images. Never overwrite the retained template asset.

If the user asks only for advice, route rearrangement, attraction ideas, or a payment/cash estimate, answer directly without editing files unless they explicitly ask to update the workbook.

## Workflow

1. Inspect the workbook or template before planning. Identify sheet names, merged cells, images, hidden rows/columns, formulas, formatting, and current column order.
2. Load references only as needed:
   - Load `references/workbook-pattern.md` for planning, workbook structure, costs, hotels, reservations, and formatting.
   - Load `references/route-map-pattern.md` before generating, replacing, reviewing, or debugging route-map images.
   - Load `references/excel-authoring-pattern.md` before using Excel COM, PowerShell, or direct `.xlsx` package editing.
3. Build a planning proposal before implementation:
   - Use one consolidated intake to confirm dates, weekdays, flight-day scope, departure/return cities and airports, estimated flight times, travelers, city sequence, pace, budget, hotel constraints, and preferred intercity-transfer window.
   - Estimate airport transfer, check-in, baggage, border-control, and time-zone effects; treat arrival and departure days as partial sightseeing days unless the user confirms they are not travel days.
   - Put each intercity transfer in the requested time window where feasible. Show door-to-door duration, method, transfer count, and fare in the proposal and the workbook; call out every necessary exception.
   - Check attraction opening days, closure risks, reservation needs, timed-entry pressure, local holidays, and museum/rest-day patterns.
   - Geocode or otherwise verify geographic order before fixing the city sequence. Use a one-direction route from arrival airport to departure airport; avoid revisiting a completed city unless it saves substantial time or cost. State the reason for every unavoidable backtrack. Split multi-city days instead of drawing one long city-to-city walking route.
   - Estimate intensity using walking distance/steps, public transit segments, queues, and meal time.
   - Recommend lodging areas and hotel types according to safety, budget, transport, and user preferences.
   - Estimate costs with explicit include/exclude rules for flights, hotels, tickets, food, transit, cash, and card usage.
4. Ask for confirmation after the proposal. Do not generate or patch the workbook until the user confirms.
5. After confirmation, create a new output file instead of overwriting the source. Prefer `outputs/` and a descriptive versioned filename. If the user later requests local changes to an already-confirmed workbook or itinerary, restate the delta and update directly; do not repeat the full intake unless the change materially affects flight-day feasibility or city order.
6. Preserve the template's visual style unless the user asks for redesign. Keep content readable without horizontal guessing: wrapped text, centered alignment where appropriate, stable widths, and row heights that fit route images.
7. Verify the generated workbook before final response: sheet names, column order, route-image count, image positions, image overlap, blank route cells for no-attraction days, formulas, and visible used ranges.
8. Verify route images visually after generation. Generate a contact sheet or equivalent preview for all route images, then inspect for real map tiles, readable labels, correct language, no blocked-tile/error-page output, no false cross-city walking lines, and no severe label overlap.

## Language

Use the user's working language for all workbook text: sheet names, column headers, cell content, route labels, notes, and cost categories. If the user does not specify a language, infer it from the source/template workbook. If no language can be inferred, default to English.

Route-map image text is workbook text too. Titles, stop labels, legends, and notes inside generated route images must use the same language as the workbook unless the user explicitly asks for bilingual or English map labels.

Keep internal concepts language-neutral. For example, the route image column is the "path/route" column conceptually; label it `Path` in English or use the appropriate localized term for the workbook language.

## Workbook Standards

- Keep day number and tentative date as separate fields when dates are provisional.
- Put the route image column immediately after the attraction/scenic-spots column, using the user's language for the visible header.
- Put food/dining before lodging when the user has requested that ordering.
- Keep sources, hotels, and cost estimates as separate sheets unless the user asks to merge them.
- Include reservation/closure risk notes where useful: exact risky dates, weekly closures, and whether advance booking is recommended.
- For every day with routeable attractions, embed a real map-route image in the path/route cell. A text-only route description does not satisfy this requirement. Use a real geographic base map with a route line, numbered stops, and workbook-language title/labels; leave the cell blank only for days with no attractions. For multi-city days, compose split local-map panels instead of a false long-distance walking line.
- Prefer colored route maps unless the user or template explicitly requires another style. For multi-city or transfer days, each city panel should start or end at the relevant station/airport rather than drawing a long cross-city or cross-region straight line.

## Common Mistakes

- Generating the workbook before the user confirms the proposed trip.
- Drip-feeding basic intake questions one at a time instead of asking for all material route inputs together.
- Omitting intercity duration, fare, transfer count, or the user's preferred transfer window from the proposed itinerary.
- Copying a city route order from text without checking geographic order.
- Scheduling avoidable backtracking between cities without explaining a concrete time, cost, or flight constraint.
- Letting route images float over the next column; every image must stay inside the path/route column cell.
- Replacing required route-map images with text-only paths or generic decorative graphics.
- Filling route images for days with no attractions.
- Generating route images with English titles or stop labels in a Chinese workbook, or vice versa.
- Accepting route-map PNGs only because they are non-empty; inspect the bitmap for blocked-tile/error-page text before inserting it.
- Drawing a cross-city or cross-region route line through a multi-city day instead of split panels.
- Leaving dense city-center labels stacked together; adjust zoom, offsets, or panels until labels are readable.
- Reusing stale map tile caches after changing tile provider, style, zoom policy, or route geometry.
- Treating a flight return day as a normal sightseeing day when time zone and airport transfer consume the day.
- Hardcoding Italy-specific assumptions or Chinese-only labels into a new destination workbook.
- Creating a Git worktree by default for a workbook artifact when the user did not ask for isolation.
