# Italy Travel Workbook Template Design

## Goal

Create a reusable travel-workbook template from the Italy reference and use it to regenerate the Istanbul itinerary without altering the original reference.

## Template asset

- Retain a copied `.xlsx` reference under `travel-plan-workbook/assets/`.
- Preserve its three-sheet structure, title regions, merged cells, column widths, row heights, fills, and route-image placement.
- Treat the asset as read-only; every new itinerary starts from a copied output workbook.

## Skill behavior

- Update `travel-plan-workbook/SKILL.md` to select the retained template when a user requests the Italy-style travel workbook.
- Require a structural inspection before replacing content.
- Preserve the template layout and create destination-specific route images only inside the route column.

## Istanbul output

- Use the template's three-sheet layout: itinerary, attractions/hotels, and cost estimate.
- Keep 2026-10-01 and 2026-10-04 as travel days, with full sightseeing on 2026-10-02 and 2026-10-03.
- Replace Italy content, sources, costs, lodging recommendations, and route images with Istanbul-specific content.

## Verification

- Confirm sheet names, used ranges, merged cells, column order, and formulas.
- Verify route-image count equals the number of routeable sightseeing days and that images stay within the route column.
- Render and visually inspect each worksheet before export.
