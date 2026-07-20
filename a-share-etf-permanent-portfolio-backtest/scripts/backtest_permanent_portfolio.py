#!/usr/bin/env python3
"""Backtest a monthly rebalanced Harry Browne style ETF portfolio from ETF closes."""

from __future__ import annotations

import argparse
import csv
import math
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class PriceRow:
    trade_date: date
    prices: dict[str, float]


AKSHARE_DATE_COLUMN = "\u65e5\u671f"
AKSHARE_CLOSE_COLUMN = "\u6536\u76d8"
ZH_CN_HEADER = {
    "date": "\u65e5\u671f",
    "total_value": "\u7ec4\u5408\u603b\u5e02\u503c",
    "period_return": "\u672c\u6708\u6536\u76ca\u7387",
    "cumulative_return": "\u7d2f\u8ba1\u6536\u76ca\u7387",
    "start_date": "\u5b9e\u9645\u8d77\u59cb\u65e5\u671f",
    "end_date": "\u7ed3\u675f\u65e5\u671f",
    "initial_capital": "\u521d\u59cb\u8d44\u91d1",
    "final_value": "\u6700\u7ec8\u8d44\u91d1",
    "annualized_return": "\u5e74\u5316\u6536\u76ca\u7387",
    "months": "\u56de\u6d4b\u6708\u4efd\u6570",
    "close": "\u6536\u76d8\u4ef7",
    "shares": "\u6301\u6709\u4efd\u989d",
    "value": "\u6301\u4ed3\u5e02\u503c",
    "weight": "\u76ee\u6807\u6743\u91cd",
}


def parse_year_month(value: str) -> tuple[int, int]:
    try:
        parsed = datetime.strptime(value, "%Y-%m")
    except ValueError as exc:
        raise ValueError(f"Expected YYYY-MM, got {value!r}") from exc
    return parsed.year, parsed.month


def parse_portfolio(value: str) -> dict[str, float]:
    weights: dict[str, float] = {}
    for item in value.split(","):
        item = item.strip()
        if not item:
            continue
        if "=" not in item:
            raise ValueError(f"Portfolio item must be ticker=weight, got {item!r}")
        ticker, raw_weight = item.split("=", 1)
        ticker = ticker.strip()
        if not ticker:
            raise ValueError("Portfolio ticker cannot be empty")
        weight = float(raw_weight)
        if weight < 0:
            raise ValueError(f"Weight for {ticker} cannot be negative")
        weights[ticker] = weights.get(ticker, 0.0) + weight
    if not weights:
        raise ValueError("Portfolio cannot be empty")
    total = sum(weights.values())
    if total <= 0:
        raise ValueError("Portfolio weights must sum to a positive number")
    return {ticker: weight / total for ticker, weight in weights.items()}


def read_prices(path: Path, tickers: Iterable[str], date_column: str) -> list[PriceRow]:
    ticker_list = list(tickers)
    rows: list[PriceRow] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            raise ValueError("Price CSV has no header row")
        missing = [name for name in [date_column, *ticker_list] if name not in reader.fieldnames]
        if missing:
            raise ValueError(f"Price CSV is missing required columns: {', '.join(missing)}")
        for line_number, row in enumerate(reader, start=2):
            raw_date = (row.get(date_column) or "").strip()
            if not raw_date:
                continue
            trade_date = datetime.strptime(raw_date, "%Y-%m-%d").date()
            prices: dict[str, float] = {}
            for ticker in ticker_list:
                raw_price = (row.get(ticker) or "").strip()
                if raw_price == "":
                    raise ValueError(f"Missing price for {ticker} on line {line_number}")
                price = float(raw_price)
                if price <= 0:
                    raise ValueError(f"Price for {ticker} on line {line_number} must be positive")
                prices[ticker] = price
            rows.append(PriceRow(trade_date=trade_date, prices=prices))
    rows.sort(key=lambda item: item.trade_date)
    return rows


def normalize_akshare_rows(rows: object, ticker: str) -> list[PriceRow]:
    if hasattr(rows, "to_dict"):
        rows = rows.to_dict("records")
    normalized: list[PriceRow] = []
    for row in rows:  # type: ignore[union-attr]
        raw_date = row.get(AKSHARE_DATE_COLUMN) or row.get("date")
        raw_close = row.get(AKSHARE_CLOSE_COLUMN) or row.get("close")
        if raw_date in (None, "") or raw_close in (None, ""):
            continue
        trade_date = datetime.strptime(str(raw_date), "%Y-%m-%d").date()
        close = float(raw_close)
        if close <= 0:
            raise ValueError(f"AKShare close for {ticker} on {trade_date.isoformat()} must be positive")
        normalized.append(PriceRow(trade_date=trade_date, prices={ticker: close}))
    if not normalized:
        raise ValueError(f"AKShare returned no usable daily close rows for {ticker}")
    normalized.sort(key=lambda item: item.trade_date)
    return normalized


def write_wide_price_csv(path: Path, rows_by_ticker: dict[str, list[PriceRow]]) -> None:
    tickers = list(rows_by_ticker)
    price_by_date: dict[date, dict[str, float]] = {}
    for ticker, rows in rows_by_ticker.items():
        for row in rows:
            price_by_date.setdefault(row.trade_date, {})[ticker] = row.prices[ticker]

    records: list[dict[str, float | str]] = []
    for trade_date in sorted(price_by_date):
        prices = price_by_date[trade_date]
        if all(ticker in prices for ticker in tickers):
            record: dict[str, float | str] = {"date": trade_date.isoformat()}
            for ticker in tickers:
                record[ticker] = prices[ticker]
            records.append(record)
    if not records:
        raise ValueError("No shared trade dates are available across all AKShare tickers")
    write_csv(path, records)


def compact_year_month(value: str, day: str) -> str:
    year, month = parse_year_month(value)
    return f"{year:04d}{month:02d}{day}"


def fetch_akshare_etf_prices(
    tickers: Iterable[str],
    start: str,
    end: str | None,
    adjust: str,
) -> dict[str, list[PriceRow]]:
    try:
        import akshare as ak  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError("AKShare is required for --source akshare. Install it with: python -m pip install akshare") from exc

    start_date = compact_year_month(start, "01")
    end_date = compact_year_month(end, "31") if end else "22220101"
    rows_by_ticker: dict[str, list[PriceRow]] = {}
    for ticker in tickers:
        data = ak.fund_etf_hist_em(
            symbol=ticker,
            period="daily",
            start_date=start_date,
            end_date=end_date,
            adjust=adjust,
        )
        rows_by_ticker[ticker] = normalize_akshare_rows(data, ticker)
    return rows_by_ticker


def select_month_ends(rows: Iterable[PriceRow]) -> list[PriceRow]:
    month_ends: dict[tuple[int, int], PriceRow] = {}
    for row in rows:
        month_ends[(row.trade_date.year, row.trade_date.month)] = row
    return [month_ends[key] for key in sorted(month_ends)]


def filter_month_ends(rows: list[PriceRow], start: str, end: str | None) -> list[PriceRow]:
    start_key = parse_year_month(start)
    end_key = parse_year_month(end) if end else None
    selected: list[PriceRow] = []
    for row in rows:
        key = (row.trade_date.year, row.trade_date.month)
        if key < start_key:
            continue
        if end_key is not None and key > end_key:
            continue
        selected.append(row)
    if not selected:
        raise ValueError("No month-end price rows fall inside the requested period")
    return selected


def rebalance_backtest(
    month_ends: list[PriceRow],
    weights: dict[str, float],
    initial_capital: float,
) -> list[dict[str, float | str]]:
    if initial_capital <= 0:
        raise ValueError("Initial capital must be positive")
    holdings = {ticker: 0.0 for ticker in weights}
    previous_value: float | None = None
    records: list[dict[str, float | str]] = []

    for index, row in enumerate(month_ends):
        if index == 0:
            total_value = initial_capital
        else:
            total_value = sum(holdings[ticker] * row.prices[ticker] for ticker in weights)

        period_return = 0.0 if previous_value is None else total_value / previous_value - 1.0
        cumulative_return = total_value / initial_capital - 1.0

        record: dict[str, float | str] = {
            "date": row.trade_date.isoformat(),
            "total_value": total_value,
            "period_return": period_return,
            "cumulative_return": cumulative_return,
        }

        for ticker, weight in weights.items():
            target_value = total_value * weight
            shares = target_value / row.prices[ticker]
            holdings[ticker] = shares
            record[f"{ticker}_close"] = row.prices[ticker]
            record[f"{ticker}_shares"] = shares
            record[f"{ticker}_value"] = target_value
            record[f"{ticker}_weight"] = weight

        records.append(record)
        previous_value = total_value

    return records


def annualized_return(initial_value: float, final_value: float, start_date: str, end_date: str) -> float | None:
    start = datetime.strptime(start_date, "%Y-%m-%d").date()
    end = datetime.strptime(end_date, "%Y-%m-%d").date()
    years = (end - start).days / 365.25
    if years < 1:
        return None
    return (final_value / initial_value) ** (1 / years) - 1


def write_csv(path: Path, records: list[dict[str, float | str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = list(records[0].keys())
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)


def write_summary(path: Path, records: list[dict[str, float | str]], initial_capital: float) -> None:
    first = records[0]
    last = records[-1]
    final_value = float(last["total_value"])
    annualized = annualized_return(initial_capital, final_value, str(first["date"]), str(last["date"]))
    summary = {
        "start_date": first["date"],
        "end_date": last["date"],
        "initial_capital": initial_capital,
        "final_value": final_value,
        "cumulative_return": final_value / initial_capital - 1.0,
        "annualized_return": "" if annualized is None else annualized,
        "months": len(records),
    }
    write_csv(path, [summary])


def translate_header_to_zh_cn(header: list[str], tickers: Iterable[str]) -> list[str]:
    translated: list[str] = []
    ticker_list = list(tickers)
    for name in header:
        if name in ZH_CN_HEADER:
            translated.append(ZH_CN_HEADER[name])
            continue
        for ticker in ticker_list:
            prefix = f"{ticker}_"
            if name.startswith(prefix):
                metric = name[len(prefix):]
                translated.append(f"{ticker}_{ZH_CN_HEADER.get(metric, metric)}")
                break
        else:
            translated.append(name)
    return translated


def write_translated_csv_copy(source_path: Path, output_path: Path, tickers: Iterable[str]) -> None:
    with source_path.open("r", encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.reader(handle))
    if not rows:
        raise ValueError(f"Cannot translate empty CSV: {source_path}")
    rows[0] = translate_header_to_zh_cn(rows[0], tickers)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8-sig", newline="") as handle:
        csv.writer(handle, lineterminator="\n").writerows(rows)


def build_monthly_return_records(records: list[dict[str, float | str]]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    for record in records:
        period_return = float(record["period_return"])
        cumulative_return = float(record["cumulative_return"])
        date_value = str(record["date"])
        output.append({
            "\u6708\u4efd": date_value[:7],
            "\u6708\u672b\u4ea4\u6613\u65e5": date_value,
            "\u7ec4\u5408\u603b\u5e02\u503c": f"{float(record['total_value']):.6f}",
            "\u672c\u6708\u6536\u76ca\u7387": f"{period_return:.12f}",
            "\u672c\u6708\u6536\u76ca\u7387\u767e\u5206\u6bd4": f"{period_return:.2%}",
            "\u7d2f\u8ba1\u6536\u76ca\u7387": f"{cumulative_return:.12f}",
            "\u7d2f\u8ba1\u6536\u76ca\u7387\u767e\u5206\u6bd4": f"{cumulative_return:.2%}",
        })
    return output


def build_yearly_return_records(records: list[dict[str, float | str]]) -> list[dict[str, str]]:
    years: dict[str, dict[str, float | str]] = {}
    previous_year_end_value: float | None = None
    first_year = str(records[0]["date"])[:4]
    last_year = str(records[-1]["date"])[:4]
    for record in records:
        year = str(record["date"])[:4]
        value = float(record["total_value"])
        if year not in years:
            years[year] = {
                "start_date": str(record["date"]),
                "start_value": previous_year_end_value if previous_year_end_value is not None else value,
            }
        years[year]["end_date"] = str(record["date"])
        years[year]["end_value"] = value
        previous_year_end_value = value

    output: list[dict[str, str]] = []
    for year in sorted(years):
        data = years[year]
        start_value = float(data["start_value"])
        end_value = float(data["end_value"])
        note = ""
        if year == first_year:
            note = "\u9996\u4e2a\u6708\u4efd\u4e3a\u5efa\u4ed3\u6708"
        elif year == last_year:
            note = "\u622a\u81f3\u533a\u95f4\u7ed3\u675f\u6708"
        annual_return = end_value / start_value - 1.0
        output.append({
            "\u5e74\u4efd": year,
            "\u8d77\u59cb\u53c2\u8003\u65e5": str(data["start_date"]),
            "\u7ed3\u675f\u4ea4\u6613\u65e5": str(data["end_date"]),
            "\u5e74\u521d\u53c2\u8003\u5e02\u503c": f"{start_value:.6f}",
            "\u5e74\u672b\u5e02\u503c": f"{end_value:.6f}",
            "\u5e74\u5ea6\u6536\u76ca\u7387": f"{annual_return:.12f}",
            "\u5e74\u5ea6\u6536\u76ca\u7387\u767e\u5206\u6bd4": f"{annual_return:.2%}",
            "\u5907\u6ce8": note,
        })
    return output


def calculate_contribution_totals(
    records: list[dict[str, float | str]],
    tickers: Iterable[str],
    initial_capital: float,
) -> tuple[list[dict[str, float | str]], dict[str, float]]:
    ticker_list = list(tickers)
    totals = {ticker: 0.0 for ticker in ticker_list}
    monthly_records: list[dict[str, float | str]] = []
    for index in range(1, len(records)):
        previous = records[index - 1]
        current = records[index]
        period_return = current.get("period_return")
        if period_return is None:
            period_return = float(current["total_value"]) / float(previous["total_value"]) - 1.0
        month_profit = 0.0
        row: dict[str, float | str] = {
            "\u65e5\u671f": current["date"],
            "\u7ec4\u5408\u5f53\u6708\u76c8\u4e8f": 0.0,
            "\u7ec4\u5408\u672c\u6708\u6536\u76ca\u7387": period_return,
        }
        for ticker in ticker_list:
            contribution = (
                float(previous[f"{ticker}_shares"])
                * (float(current[f"{ticker}_close"]) - float(previous[f"{ticker}_close"]))
            )
            row[f"{ticker}_\u5f53\u6708\u76c8\u4e8f"] = contribution
            row[f"{ticker}_\u5bf9\u521d\u59cb\u8d44\u91d1\u8d21\u732e"] = contribution / initial_capital
            totals[ticker] += contribution
            month_profit += contribution
        row["\u7ec4\u5408\u5f53\u6708\u76c8\u4e8f"] = month_profit
        monthly_records.append(row)
    return monthly_records, totals


def calculate_max_drawdown(values: Iterable[float]) -> float:
    iterator = iter(values)
    try:
        peak = next(iterator)
    except StopIteration as exc:
        raise ValueError("Cannot calculate drawdown for empty values") from exc
    max_drawdown = 0.0
    for value in [peak, *iterator]:
        peak = max(peak, value)
        max_drawdown = min(max_drawdown, value / peak - 1.0)
    return max_drawdown


def annualized_volatility(monthly_returns: list[float]) -> float | None:
    if len(monthly_returns) < 2:
        return None
    average = sum(monthly_returns) / len(monthly_returns)
    variance = sum((item - average) ** 2 for item in monthly_returns) / (len(monthly_returns) - 1)
    return math.sqrt(variance) * math.sqrt(12)


def write_dict_csv(path: Path, rows: list[dict[str, float | str]]) -> None:
    if not rows:
        raise ValueError(f"Cannot write empty CSV: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()), lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def write_zh_cn_report_bundle(
    output_path: Path,
    summary_path: Path,
    price_path: Path | None,
    records: list[dict[str, float | str]],
    weights: dict[str, float],
    initial_capital: float,
    adjust: str,
) -> dict[str, Path]:
    tickers = list(weights)
    prefix = output_path.with_suffix("")
    monthly_returns_path = prefix.with_name(prefix.name + ".monthly_returns.zh-CN.csv")
    yearly_returns_path = prefix.with_name(prefix.name + ".yearly_returns.zh-CN.csv")
    contribution_path = prefix.with_name(prefix.name + ".contribution.zh-CN.csv")
    report_path = prefix.with_name(prefix.name + ".summary.zh-CN.md")
    contribution_report_path = prefix.with_name(prefix.name + ".contribution_summary.zh-CN.md")
    monthly_zh_path = prefix.with_name(prefix.name + ".zh-CN.csv")
    summary_zh_path = summary_path.with_name(summary_path.stem + ".zh-CN.csv")

    write_translated_csv_copy(output_path, monthly_zh_path, tickers)
    write_translated_csv_copy(summary_path, summary_zh_path, tickers)
    price_zh_path: Path | None = None
    if price_path is not None and price_path.exists():
        price_zh_path = price_path.with_name(price_path.stem + ".zh-CN.csv")
        write_translated_csv_copy(price_path, price_zh_path, tickers)

    monthly_return_records = build_monthly_return_records(records)
    yearly_return_records = build_yearly_return_records(records)
    contribution_records, contribution_totals = calculate_contribution_totals(records, tickers, initial_capital)
    write_dict_csv(monthly_returns_path, monthly_return_records)
    write_dict_csv(yearly_returns_path, yearly_return_records)
    write_dict_csv(contribution_path, contribution_records)

    values = [float(record["total_value"]) for record in records]
    period_returns = [float(record["period_return"]) for record in records]
    non_initial_returns = period_returns[1:]
    final_value = values[-1]
    total_profit = final_value - initial_capital
    annualized = annualized_return(initial_capital, final_value, str(records[0]["date"]), str(records[-1]["date"]))
    max_drawdown = calculate_max_drawdown(values)
    volatility = annualized_volatility(non_initial_returns)
    best_index = max(range(len(period_returns)), key=lambda index: period_returns[index])
    worst_index = min(range(len(period_returns)), key=lambda index: period_returns[index])

    lines = [
        f"# A\u80a1 ETF \u7ec4\u5408\u56de\u6d4b\u6c47\u603b\uff08{adjust or '\u4e0d\u590d\u6743'}\uff09",
        "",
        "- \u7ec4\u5408\uff1a" + "\uff1b".join(f"{ticker} {weight:.2%}" for ticker, weight in weights.items()) + "\u3002",
        f"- \u5b9e\u9645\u56de\u6d4b\u533a\u95f4\uff1a{records[0]['date']} \u5230 {records[-1]['date']}\u3002",
        f"- \u521d\u59cb\u8d44\u91d1 {initial_capital:,.2f} \u5143\uff0c\u6700\u7ec8\u8d44\u91d1 {final_value:,.2f} \u5143\u3002",
        f"- \u7d2f\u8ba1\u6536\u76ca\u7387 {final_value / initial_capital - 1.0:.2%}\uff0c\u5e74\u5316\u6536\u76ca\u7387 {'' if annualized is None else f'{annualized:.2%}'}\u3002",
        f"- \u6700\u5927\u56de\u64a4\uff08\u6708\u672b\u53e3\u5f84\uff09\uff1a{max_drawdown:.2%}\u3002",
        f"- \u5e74\u5316\u6ce2\u52a8\u7387\uff08\u6708\u6536\u76ca\u4f30\u7b97\uff09\uff1a{'' if volatility is None else f'{volatility:.2%}'}\u3002",
        f"- \u6700\u597d\u5355\u6708\uff1a{records[best_index]['date']}\uff0c{period_returns[best_index]:.2%}\uff1b\u6700\u5dee\u5355\u6708\uff1a{records[worst_index]['date']}\uff0c{period_returns[worst_index]:.2%}\u3002",
        "",
        "## \u5e74\u5ea6\u6536\u76ca\u7387",
        "",
        "| \u5e74\u4efd | \u6536\u76ca\u7387 | \u5907\u6ce8 |",
        "| --- | ---: | --- |",
    ]
    for row in yearly_return_records:
        lines.append(f"| {row['\u5e74\u4efd']} | {row['\u5e74\u5ea6\u6536\u76ca\u7387\u767e\u5206\u6bd4']} | {row['\u5907\u6ce8']} |")
    lines.extend([
        "",
        "## \u6587\u4ef6",
        "",
        f"- \u6708\u5ea6\u660e\u7ec6\uff08\u4e2d\u6587\u8868\u5934\uff09\uff1a{monthly_zh_path}",
        f"- \u6c47\u603b CSV\uff08\u4e2d\u6587\u8868\u5934\uff09\uff1a{summary_zh_path}",
        f"- \u6bcf\u6708\u6536\u76ca\u7387\uff1a{monthly_returns_path}",
        f"- \u6bcf\u5e74\u6536\u76ca\u7387\uff1a{yearly_returns_path}",
        f"- \u6536\u76ca\u8d21\u732e\u660e\u7ec6\uff1a{contribution_path}",
    ])
    if price_zh_path is not None:
        lines.append(f"- \u4ef7\u683c\u8f93\u5165\uff08\u4e2d\u6587\u8868\u5934\uff09\uff1a{price_zh_path}")
    report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

    ranked = sorted(contribution_totals.items(), key=lambda item: item[1], reverse=True)
    contribution_lines = [
        f"# \u6536\u76ca\u8d21\u732e\u62c6\u89e3\uff08{adjust or '\u4e0d\u590d\u6743'}\uff09",
        "",
        f"- \u603b\u76c8\u5229\uff1a{total_profit:,.2f} \u5143\u3002",
        f"- \u8d21\u732e\u53e3\u5f84\uff1a\u4e0a\u6708\u518d\u5e73\u8861\u540e\u6301\u6709\u4efd\u989d \u00d7 \u672c\u6708\u6536\u76d8\u4ef7\u53d8\u5316\u3002",
        "",
        "| \u6807\u7684 | \u76ee\u6807\u6743\u91cd | \u7d2f\u8ba1\u76c8\u4e8f\uff08\u5143\uff09 | \u5bf9\u521d\u59cb\u8d44\u91d1\u8d21\u732e | \u5360\u603b\u76c8\u5229\u6bd4\u4f8b |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for ticker, contribution in ranked:
        contribution_lines.append(
            f"| {ticker} | {weights[ticker]:.2%} | {contribution:,.2f} | "
            f"{contribution / initial_capital:.2%} | {contribution / total_profit:.2%} |"
        )
    contribution_report_path.write_text("\n".join(contribution_lines) + "\n", encoding="utf-8")

    return {
        "monthly_zh": monthly_zh_path,
        "summary_zh": summary_zh_path,
        "monthly_returns": monthly_returns_path,
        "yearly_returns": yearly_returns_path,
        "contribution": contribution_path,
        "summary_report": report_path,
        "contribution_report": contribution_report_path,
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", choices=["csv", "akshare"], default="csv", help="Price source. Default: csv")
    parser.add_argument("--prices", type=Path, help="Wide CSV with date and one close column per ticker")
    parser.add_argument("--portfolio", required=True, help='Comma list like "510300=0.25,511010=0.25"')
    parser.add_argument("--start", required=True, help="Start year-month, YYYY-MM")
    parser.add_argument("--capital", required=True, type=float, help="Initial capital")
    parser.add_argument("--out", required=True, type=Path, help="Monthly output CSV path")
    parser.add_argument("--end", help="Optional end year-month, YYYY-MM")
    parser.add_argument("--date-column", default="date", help="Date column name. Default: date")
    parser.add_argument("--summary", type=Path, help="Summary CSV path")
    parser.add_argument("--akshare-adjust", default="qfq", choices=["", "qfq", "hfq"], help="AKShare adjust value. Default: qfq")
    parser.add_argument("--akshare-prices-out", type=Path, help="Optional path for the fetched wide price CSV")
    parser.add_argument("--zh-cn-reports", action="store_true", help="Write Chinese report files, return tables, and contribution analysis")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    weights = parse_portfolio(args.portfolio)
    if args.source == "akshare":
        price_path = args.akshare_prices_out or args.out.with_suffix(".prices.csv")
        write_wide_price_csv(price_path, fetch_akshare_etf_prices(weights.keys(), args.start, args.end, args.akshare_adjust))
        daily_rows = read_prices(price_path, weights.keys(), args.date_column)
        print(f"price_source=akshare")
        print(f"price_output={price_path}")
    else:
        if args.prices is None:
            raise ValueError("--prices is required when --source csv")
        daily_rows = read_prices(args.prices, weights.keys(), args.date_column)
    month_ends = filter_month_ends(select_month_ends(daily_rows), args.start, args.end)
    records = rebalance_backtest(month_ends, weights, args.capital)
    summary_path = args.summary or args.out.with_suffix(".summary.csv")
    write_csv(args.out, records)
    write_summary(summary_path, records, args.capital)
    if args.zh_cn_reports:
        generated = write_zh_cn_report_bundle(
            output_path=args.out,
            summary_path=summary_path,
            price_path=price_path if args.source == "akshare" else args.prices,
            records=records,
            weights=weights,
            initial_capital=args.capital,
            adjust=args.akshare_adjust if args.source == "akshare" else "csv",
        )
        for name, path in generated.items():
            print(f"{name}={path}")
    print(f"monthly_output={args.out}")
    print(f"summary_output={summary_path}")
    print(f"start_date={records[0]['date']}")
    print(f"end_date={records[-1]['date']}")
    print(f"final_value={records[-1]['total_value']:.6f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
