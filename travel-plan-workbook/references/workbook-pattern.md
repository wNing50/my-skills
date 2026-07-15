# Travel Workbook Pattern

Use this reference after `travel-plan-workbook` triggers and the task involves workbook generation, workbook edits, route images, cost estimates, hotels, reservations, or formatting.

## Intake Checklist

- Source: template workbook path, destination, departure city, return destination, travelers, date range, whether the range includes outbound/return flight days, planned or estimated flight times, must-see places, pace, budget, hotel constraints, payment assumptions, and visa/entry constraints.
- Italy-style template: when requested, clone `../assets/template.xlsx` into `outputs/` before editing. Preserve the three sheets, title merges, column widths, row heights, fills, and image anchors; only replace destination-specific data and route images.
- Flight-day timing: before proposing the itinerary, estimate airport transfer, check-in, baggage, border-control, and time-zone effects. Treat arrival and departure days as partial by default; do not schedule them as full sightseeing days unless the user explicitly confirms they are not flight days.
- Workbook shape: sheet names, used ranges, images, formulas, merged cells, filters, hidden rows/columns, and current column order.
- Research needs: official attraction pages or reliable current sources for openings, closures, ticketing, transport, and public holidays. Browse when information can change.
- Output rule: save as a new workbook in `outputs/`. Do not overwrite the source workbook.

## Recommended Sheet Set

Adapt sheet names to the user's language. If language is unspecified and cannot be inferred from the workbook, default to English.

- `Itinerary` / `行程安排`: day-by-day itinerary.
- `Lodging and Reservations` / `住宿与预约`: hotels, booking links/sources, cancellation notes, attraction reservation requirements, closure-risk dates.
- `Cost Estimate` / `费用估算`: transportation, tickets, food, city transit, hotels if included, flights if included, cash/card estimate, currency assumptions.

If the user requests three sheets, keep these concerns separate. If a template already has equivalent sheets, reuse the existing names and style.

## Main Itinerary Columns

Use the template's columns when possible. Default to English labels unless the user or source workbook uses another language. A robust default order is:

`Day`, `Date`, `City`, `Plan`, `Attractions`, `Path`, `Intercity Transport`, `Local Transport`, `Food`, `Lodging`, `Reservations/Closure Risk`, `Intensity`, `Notes`

For Chinese workbooks, localize the same conceptual fields as:

`天数`, `日期`, `城市`, `主要行程`, `景点`, `路径`, `城市间交通`, `市内交通`, `饮食`, `住宿`, `预约/闭馆风险`, `强度评估`, `备注`

Rules:

- Keep the day-number column before the date column.
- Treat the date column as tentative when the user says dates are provisional.
- Place the path/route-image column immediately after the attractions/scenic-spots column.
- Place food/dining before lodging.
- Remove source/detail columns from the main sheet when the user asked for a cleaner view; move source notes to the supporting sheet.

## Route Maps

Generate route images only for rows that have same-day attractions or routeable scenic stops. Leave the path/route cell blank if there are no attractions.

Route ordering:

- Geocode the attractions, then inspect spatial order before drawing.
- Reduce backtracking by ordering nearby stops in a natural sweep from the likely hotel/station/arrival point to the final area.
- If user text order causes a loop or repeated crossing, adjust the route order and note the change in the plan before implementation.
- For multi-city days, use split panels or separate route blocks by city instead of connecting distant cities with a walking line.

Image layout:

- Constrain every picture within the path/route cell; verify the image's right edge is before the next column's left edge.
- Prefer a wide path column and taller rows for readability. A proven baseline is column width about `105`, row height about `330`, image about `545 x 320` points, centered with small padding.
- Do not preserve aspect ratio by stretching into a narrow cell. Increase the column/row instead.
- Use clear map tiles, readable labels, and visible numbered markers. Avoid dark or blurred maps.
- Match route-map image language to the workbook language. If the workbook is Chinese, route titles, stop labels, legends, and map notes should be Chinese; keep foreign place names only when they are the expected local names or when the user asks for bilingual labels.
- If using OpenStreetMap/static tiles, include attribution where appropriate in the image or workbook notes. Prefer compliant tile providers for generated static images; if a provider blocks tile use, switch to a reliable permitted source instead of embedding the blocked response.

Image verification:

- Inspect generated route PNGs visually before inserting them into the workbook. File existence, HTTP 200, non-zero size, and correct dimensions are not enough.
- Check for provider error text such as `403`, `Access blocked`, `policy`, missing-tile warnings, blank tiles, cropped stop markers, overlapping labels, unreadably small labels, and route lines outside the visible map.
- If stops are dense, adjust zoom, crop, or per-label offsets and regenerate the image before workbook insertion.
- After inserting images, render/export the workbook or copy used ranges to preview images and confirm the pictures remain inside the path/route cells.

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
- Confirm route-map image text uses the workbook language unless the user requested otherwise.
- Confirm route PNGs are real map images, not blocked-tile/error-page screenshots.
- Confirm no-attraction rows have blank route cells.
- Check formulas have no obvious errors and totals are visible.
- Save and report the output workbook path.
