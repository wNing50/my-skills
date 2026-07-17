# Route Map Pattern

Use this reference after `travel-plan-workbook` triggers and the task involves route-map images, map tile fetching, route image replacement, route visual review, or map-related debugging.

## Map Style

- Prefer colored map tiles for deliverable workbooks unless the user or template explicitly asks for a muted/light style.
- A reliable default is a colored OpenStreetMap-derived tile provider such as Carto Voyager. If a provider blocks, rate-limits, or returns error tiles, switch provider rather than embedding degraded output.
- Use a new cache directory when changing tile provider, tile style, zoom policy, route geometry, or label logic. Do not trust old cached tiles after a map rendering change.
- Include map attribution in the route image or workbook notes when using third-party tiles.

## Route Types

### Single-city days

- Fit the route closely around the actual attractions, not around the entire city.
- Use the highest zoom level that fits all stops with padding. Dense city centers should usually render closer than airport or regional transfer maps.
- Use numbered stops, a visible route line, and workbook-language labels.
- Offset labels around the markers; avoid placing every label to the same side when stops are close together.
- If labels still collide, split the day into panels or reduce the number of text labels while keeping numbered markers readable.

### Multi-city or transfer days

- Do not draw one long walking/route line between cities.
- Use split panels or separate route blocks:
  - Departure-city panel: start at the local activity/likely lodging area and end at the departure station or airport.
  - Arrival-city panel: start at the arrival station or airport and end at the local activity/likely lodging area.
- For airport-only travel days, a single airport-to-lodging or lodging-to-airport map is acceptable when there are no sightseeing stops.
- Keep panel titles concise and in the workbook language, such as `Day 7 Morning Venice` and `Day 7 Evening Milan` for an English workbook.

## Image Layout

- Use stable image dimensions that match the workbook path/route column. A proven baseline is about `1100 x 640 px` source PNG inserted into a path cell around `545 x 320 pt`.
- Center each image inside the route cell with small padding. Do not let the image edge cross into the next column.
- Keep row heights stable before image insertion so Excel does not resize or overlap images unexpectedly.

## Visual Verification

Always generate a contact sheet or equivalent preview containing every route image before inserting or delivering the workbook.

Check each route image for:

- Real map tiles rather than blank/error tiles.
- No visible provider error text such as `403`, `Access blocked`, `policy`, or missing-tile warnings.
- Colored map style when colored maps were requested or expected.
- Correct workbook-language title and labels.
- Numbered stops visible and in a plausible geographic order.
- Dense labels still readable after insertion scale.
- Multi-city days rendered as panels, not cross-city straight lines.
- No route line or marker cropped outside the map.

After inserting images into Excel, reopen or inspect the workbook and verify:

- Number of route images equals the number of routeable itinerary rows.
- No image is present on no-attraction/no-route days.
- Every image is anchored within the path/route column.
- No image overlaps adjacent columns or rows.
