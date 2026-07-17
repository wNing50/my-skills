# Travel Workbook Pattern

Use this reference after `travel-plan-workbook` triggers and the task involves workbook generation, workbook edits, route images, cost estimates, hotels, reservations, or formatting.

## Intake Checklist

- Send one consolidated intake request after source/template inspection. Collect: template path, destination, departure city, return destination, travelers, date range/weekdays, whether outbound/return flight days are included, airports and planned/estimated flight times, must-see places, pace, budget, hotel constraints, payment assumptions, visa/entry constraints, and the preferred intercity-transfer window (`morning`/`afternoon`/`evening`). Do not serially ask one basic field per message. Follow up only when an omitted answer materially changes the itinerary.
- Italy-style template: when requested, clone `../assets/template.xlsx` into `outputs/` before editing. Preserve the three sheets, title merges, column widths, row heights, fills, and image anchors; only replace destination-specific data and route images.
- Flight-day timing: before proposing the itinerary, estimate airport transfer, check-in, baggage, border-control, and time-zone effects. Treat arrival and departure days as partial by default; do not schedule them as full sightseeing days unless the user explicitly confirms they are not flight days.
- Intercity timing: schedule each city change in the user's requested morning/afternoon/evening window where feasible. Record door-to-door duration, transfer count, fare, luggage handling, and any exception in both the proposal and main itinerary.
- Workspace: generate in the current workspace; do not create a Git worktree unless the user explicitly asks for it.
- Workbook shape: sheet names, used ranges, images, formulas, merged cells, filters, hidden rows/columns, and current column order.
- Research needs: official attraction pages or reliable current sources for openings, closures, ticketing, transport, and public holidays. Browse when information can change.
- Output rule: save as a new workbook in `outputs/`. Do not overwrite the source workbook.

## Recommended Sheet Set

Adapt sheet names to the user's language. If language is unspecified and cannot be inferred from the workbook, default to English.

- `Itinerary`: day-by-day itinerary.
- `Lodging and Reservations`: hotels, booking links/sources, cancellation notes, attraction reservation requirements, closure-risk dates.
- `Cost Estimate`: transportation, tickets, food, city transit, hotels if included, flights if included, cash/card estimate, currency assumptions.

If the user requests three sheets, keep these concerns separate. If a template already has equivalent sheets, reuse the existing names and style.

## Main Itinerary Columns

Use the template's columns when possible. Default to English labels unless the user or source workbook uses another language. A robust default order is:

`Day`, `Date`, `City`, `Plan`, `Attractions`, `Path`, `Intercity Transport`, `Local Transport`, `Food`, `Lodging`, `Reservations/Closure Risk`, `Intensity`, `Notes`

For non-English workbooks, translate the same conceptual fields into the workbook language while retaining this column order.

Rules:

- Keep the day-number column before the date column.
- Treat the date column as tentative when the user says dates are provisional.
- Place the path/route-image column immediately after the attractions/scenic-spots column.
- Place food/dining before lodging.
- Remove source/detail columns from the main sheet when the user asked for a cleaner view; move source notes to the supporting sheet.

## Route Maps

Load `route-map-pattern.md` before generating, replacing, or reviewing route images.

Workbook-level rules:

- Generate a real map-route image for every row that has same-day attractions or routeable scenic stops.
- Leave the path/route cell blank only if there are no attractions or routeable stops.
- Put the route image column immediately after the attractions/scenic-spots column.
- For multi-city or transfer days, use split city panels instead of one long cross-city route line.
- Prefer colored route maps unless the template or user asks for another style.
- Keep titles, stop labels, legends, and map notes in the workbook language.
- Constrain every picture within the path/route cell; verify the image's right edge is before the next column's left edge.

## Formatting

- Wrap text in itinerary cells.
- Center day/date/city/status cells vertically and horizontally where it improves scanning.
- Use stable row heights and column widths; avoid images resizing rows unexpectedly.
- Keep route-image rows taller than text-only rows.
- Freeze header row if useful.
- Use consistent font, borders, and fills from the template.

## Planning Review Before Confirmation

Before asking the user to confirm, include:

- Day-by-day city and main route order.
- Travel-day handling: state the outbound departure city, return destination, estimated flight and airport-transfer timing, and the usable sightseeing window on both ends of the trip.
- Feasibility rating per day: easy, moderate, full, or too tight.
- Reservation/closure risks with exact risky dates when available.
- Lodging area recommendation and constraints.
- Cost scope: what is included and excluded.
- Any assumptions that materially affect the workbook.

## Cost Estimate Sheet

Make assumptions explicit:

- Currency and exchange rate/date.
- Whether international flights and hotels are included.
- Tickets/attractions, city transit, intercity transit, airport transfer, food, local SIM/eSIM, insurance, and buffer.
- Cash recommendation and card-credit recommendation when user asks.

Use formulas for totals and per-person splits when practical. Do not hide major assumptions in prose only.

## Verification Checklist

Before final response:

- Open workbook metadata or inspect with Excel/openpyxl/COM to confirm sheets exist.
- Confirm main sheet column order matches the user's requested order.
- Count route images and compare with rows that should have route images.
- Verify no route image overlaps the next column.
- Generate and inspect a contact sheet or equivalent preview of all route images.
- Confirm multi-city or transfer days use split panels with station/airport endpoints instead of cross-city lines.
- Confirm dense city-center route labels are readable.
- Confirm route-map image text uses the workbook language unless the user requested otherwise.
- Confirm route PNGs are real map images, not blocked-tile/error-page screenshots.
- Confirm no-attraction rows have blank route cells.
- Check formulas have no obvious errors and totals are visible.
- Save and report the output workbook path.
