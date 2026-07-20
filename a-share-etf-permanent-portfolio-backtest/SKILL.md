---
name: a-share-etf-permanent-portfolio-backtest
description: Use when Codex needs to create, explain, run, or adapt an A-share or China ETF investment portfolio backtest using Harry Browne permanent portfolio style allocation, monthly end-of-month close-price rebalancing, user-provided start year-month, initial capital, ETF tickers, weights, AKShare ETF price fetching, qfq/adjusted-price assumptions, Chinese reports, monthly/yearly returns, contribution analysis, or local CSV/Excel price data.
---

# A-share ETF Permanent Portfolio Backtest

## Core Rule

Use this skill when the user wants to backtest an A-share or China ETF portfolio that is rebalanced at each month end. Treat this as educational analysis, not personalized financial advice. Do not promise future returns or recommend that the user buy a fund.

Before running a backtest, confirm the minimum inputs in one concise intake:

- Portfolio tickers and target weights. If the user says "Harry Browne" or "permanent portfolio" without details, propose four equal 25% sleeves: equity ETF, long/intermediate bond ETF, gold ETF, and cash/money-market ETF; ask the user to confirm the actual tickers.
- Start year-month, such as `2015-01`.
- Initial capital.
- Price source. Prefer AKShare when the user approves online public-market data. Use a local wide CSV when the user provides exported data from Tonghuashun, another broker, or a data vendor.
- Adjustment mode. Prefer `qfq` when the user wants a dividend-reinvestment or total-return style backtest; use unadjusted prices only when matching historical transaction prices.
- Optional end year-month, fee/slippage assumptions, whether fractional ETF shares are allowed, and whether Chinese report files are desired.

If any required market data is missing, ask the user to provide it or explicitly approve fetching/converting data. AKShare ETF data can change if its upstream public data source changes, so keep the fetched price CSV as an audit artifact.

## Backtest Method

Use monthly rebalancing only:

1. Sort daily close prices by trade date.
2. For each calendar month, select the last available trading day in the price file.
3. Start at the first selected month-end on or after the requested start month.
4. Buy the target portfolio using the month-end close prices and initial capital.
5. At every following selected month-end, value current holdings at close prices, then rebalance the full portfolio back to target weights.
6. Record total value, period return, cumulative return, each asset's close price, share quantity, market value, and actual weight.

Default assumptions:

- Allow fractional shares unless the user requests board-lot or integer-share trading.
- Ignore tax, dividend reinvestment, fund distributions, subscription/redemption limits, and tracking-error effects unless the user provides data.
- Use close prices only. Do not mix adjusted and unadjusted prices across assets. With AKShare, default to `qfq` for long-horizon return analysis unless the user explicitly wants unadjusted transaction-price history.
- Keep weights normalized to sum to 1.0, but warn the user when the provided weights did not originally sum to 1.0.
- If one or more ETFs start trading after the requested start month, state the actual first month-end where all tickers have usable prices.

## Script

Use `scripts/backtest_permanent_portfolio.py` for deterministic calculation. It supports AKShare fetching or a local wide CSV.

AKShare mode:

```powershell
python scripts/backtest_permanent_portfolio.py `
  --source akshare `
  --portfolio "510300=0.25,511010=0.25,518880=0.25,511880=0.25" `
  --start 2018-01 `
  --end 2024-12 `
  --capital 100000 `
  --out outputs/monthly_backtest.csv `
  --akshare-prices-out outputs/akshare_prices.csv `
  --zh-cn-reports
```

Install AKShare if needed:

```powershell
python -m pip install akshare
```

The script calls AKShare `fund_etf_hist_em` with `period="daily"` and uses AKShare's date and close columns. Keep the generated `--akshare-prices-out` CSV with the result files so future review can reproduce the exact price input used by the backtest.

Use `--akshare-adjust qfq` for front-adjusted prices. This is the default and is usually the right choice when the user assumes dividends are reinvested. Use `--akshare-adjust ""` only when the user wants raw historical transaction prices.

CSV mode:

```powershell
python scripts/backtest_permanent_portfolio.py `
  --prices prices.csv `
  --portfolio "510300=0.25,511010=0.25,518880=0.25,511880=0.25" `
  --start 2018-01 `
  --capital 100000 `
  --out outputs/monthly_backtest.csv
```

Expected CSV input:

```csv
date,510300,511010,518880,511880
2018-01-02,4.10,104.50,2.75,100.01
2018-01-31,4.25,104.80,2.81,100.04
```

Useful options:

- `--end YYYY-MM`: stop at the last month-end on or before the month.
- `--date-column name`: use a different date column.
- `--summary path.csv`: write a one-row summary CSV. Defaults to the output path with `.summary.csv`.
- `--source akshare`: fetch ETF daily close prices from AKShare before backtesting.
- `--akshare-adjust qfq|hfq`: request forward-adjusted or backward-adjusted prices from AKShare. The default is `qfq`.
- `--akshare-prices-out path.csv`: save the fetched AKShare prices as a wide CSV. Defaults to the output path with `.prices.csv`.
- `--zh-cn-reports`: write Chinese report files: translated CSV copies, monthly return rates, yearly return rates, contribution details, summary Markdown, and contribution Markdown.

The script prints the summary path and monthly result path after completion.

## Output Standards

In the final answer, include:

- The portfolio and normalized target weights.
- Actual start and end month-end dates used.
- Initial capital, final value, cumulative return, and annualized return when at least one year is covered.
- A short note about assumptions and missing costs.
- Paths to generated result files.
- If AKShare was used, the AKShare price CSV path and adjustment mode.
- If `--zh-cn-reports` was used, the Chinese summary, monthly/yearly return, and contribution paths.

When explaining results, distinguish between:

- Strategy mechanics: deterministic calculations from the input data.
- Data limitations: missing dates, adjusted/unadjusted prices, dividends, fees, and survivorship bias.
- Investment interpretation: educational discussion only, not a buy/sell instruction.
- Contribution analysis: each asset's monthly contribution is previous month-end post-rebalance shares times current month price change. Contributions should sum to final value minus initial capital.

## Common Mistakes

- Rebalancing on calendar month-end instead of the last available trading day.
- Buying at the first daily row of the start month instead of the first month-end row on or after the requested start month.
- Forgetting to rebalance after valuing existing holdings.
- Mixing fund net value, adjusted close, and close price columns without telling the user.
- Using AKShare live output without saving the fetched price CSV, which makes later reproduction harder.
- Comparing Tonghuashun front-adjusted chart prices with unadjusted AKShare output and treating the difference as an error.
- Forgetting that a requested start month may be later in practice when one ETF has no earlier price history.
- Treating a four-ETF example as a recommendation rather than a placeholder permanent-portfolio structure.
- Reporting an annualized return for a period shorter than one year without clearly labeling it as not meaningful.
