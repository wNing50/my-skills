# Excel Authoring Pattern

Use this reference after `travel-plan-workbook` triggers and the task uses Excel COM, PowerShell, direct `.xlsx` ZIP/XML editing, or any local workbook authoring fallback.

## Template Handling

- Treat workbook templates as read-only assets. Copy the template to `outputs/<trip_id>/` before editing.
- Preserve sheet count, sheet names, title merges, column widths, row heights, fills, and route-image column placement unless the user explicitly asks for redesign.
- Clear old route images before inserting replacement images to avoid stacked pictures.
- Keep day number and tentative date in separate cells.
- Leave route cells blank for no-attraction/no-route days.

## PowerShell And Encoding

- Save PowerShell scripts that contain Chinese or other non-ASCII workbook text as UTF-8 with BOM when running under Windows PowerShell 5.
- Avoid relying on implicit PowerShell array behavior for table data. Store table rows as explicit row arrays, and normalize them before writing to Excel.
- Wrap Excel cell writes in a helper that writes numbers as numbers and text as strings. This avoids COM overload/type-cast surprises with mixed data.
- Do not build destructive cleanup commands across shells. If old caches should not be reused, prefer versioned cache directories such as `tile-cache-color-v3`.

## Excel COM Editing

- Set `DisplayAlerts = $false` and close workbooks in `finally` blocks.
- Delete existing route-image shapes on the itinerary sheet before inserting new route images.
- Set route-column width and route-row height before inserting images.
- Insert images using the route cell's `Left`, `Top`, `Width`, and `Height` with small padding.
- Freeze panes only after activating the target sheet and selecting the intended anchor cell.

## Formula And Value Rules

- Keep auditable assumptions visible in the cost sheet.
- Use formulas for totals, currency conversion, and per-person splits.
- Store numeric assumptions as typed numeric values, not formatted strings.
- Use plain-text URLs in source cells for research-backed rows.

## Verification

Reopen or inspect the saved workbook before final delivery.

Check:

- Expected sheet names and sheet count.
- Used ranges are plausible and not blank.
- Main itinerary column order matches the template or requested order.
- Route-image shape count matches routeable rows.
- Formula-error scan finds no `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?`, or `#N/A`.
- Important totals and per-person values are visible.
- Output path is a new workbook under `outputs/`, not the template asset.
