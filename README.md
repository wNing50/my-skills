# My Skills

[Chinese](README.zh-CN.md)

Some skills using in my life.

This repository stores Codex skills I use in daily life and work. Each skill is meant to capture reusable workflows, templates, and practical guardrails instead of one-off scripts.

## Skills

### a-share-etf-permanent-portfolio-backtest

Backtests A-share and China ETF portfolios with monthly end-of-month rebalancing.

This skill is designed for portfolio research workflows with:

- AKShare ETF daily close-price fetching;
- qfq front-adjusted prices by default for dividend-reinvestment style analysis;
- local wide CSV support for broker or vendor exports;
- normalized target weights and month-end rebalancing;
- actual start-date reporting when an ETF has shorter history than the requested range;
- Chinese report generation with monthly returns, yearly returns, summary Markdown, and contribution analysis;
- educational portfolio diagnostics without buy/sell recommendations.

### travel-plan-workbook

Creates and edits travel itinerary Excel workbooks after confirming the real trip window, especially whether the date range includes outbound and return flight days.

This skill is designed for practical travel planning workbooks with:

- day-by-day itinerary planning;
- route-map image placement and visual verification;
- hotel, reservation, closure-risk, and source tracking;
- budget and cash/card estimates;
- reusable Italy-style Excel workbook formatting via `assets/template.xlsx`;
- consistent language across workbook text and generated route-map labels;
- checks that blocked map tiles, error pages, or malformed images are not inserted into final workbooks.
