import unittest
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory

from backtest_permanent_portfolio import (
    PriceRow,
    build_monthly_return_records,
    build_yearly_return_records,
    calculate_contribution_totals,
    filter_month_ends,
    normalize_akshare_rows,
    parse_portfolio,
    rebalance_backtest,
    select_month_ends,
    translate_header_to_zh_cn,
    write_wide_price_csv,
)


class PermanentPortfolioBacktestTests(unittest.TestCase):
    def test_parse_portfolio_normalizes_weights(self):
        weights = parse_portfolio("510300=25,511010=25,518880=25,511880=25")

        self.assertEqual(weights, {
            "510300": 0.25,
            "511010": 0.25,
            "518880": 0.25,
            "511880": 0.25,
        })

    def test_select_month_ends_uses_last_available_trade_day(self):
        rows = [
            PriceRow(date(2020, 1, 2), {"A": 1.0}),
            PriceRow(date(2020, 1, 31), {"A": 2.0}),
            PriceRow(date(2020, 2, 3), {"A": 3.0}),
            PriceRow(date(2020, 2, 28), {"A": 4.0}),
        ]

        selected = select_month_ends(rows)

        self.assertEqual([row.trade_date for row in selected], [date(2020, 1, 31), date(2020, 2, 28)])

    def test_backtest_rebalances_to_target_weights_at_each_month_end(self):
        weights = {"A": 0.5, "B": 0.5}
        month_ends = [
            PriceRow(date(2020, 1, 31), {"A": 10.0, "B": 20.0}),
            PriceRow(date(2020, 2, 28), {"A": 20.0, "B": 20.0}),
            PriceRow(date(2020, 3, 31), {"A": 20.0, "B": 10.0}),
        ]

        records = rebalance_backtest(month_ends, weights, 1000.0)

        self.assertAlmostEqual(records[0]["total_value"], 1000.0)
        self.assertAlmostEqual(records[1]["total_value"], 1500.0)
        self.assertAlmostEqual(records[1]["A_value"], 750.0)
        self.assertAlmostEqual(records[1]["B_value"], 750.0)
        self.assertAlmostEqual(records[2]["total_value"], 1125.0)
        self.assertAlmostEqual(records[2]["cumulative_return"], 0.125)

    def test_filter_month_ends_starts_at_requested_year_month(self):
        rows = [
            PriceRow(date(2019, 12, 31), {"A": 1.0}),
            PriceRow(date(2020, 1, 23), {"A": 2.0}),
            PriceRow(date(2020, 2, 28), {"A": 3.0}),
        ]

        selected = filter_month_ends(rows, "2020-01", None)

        self.assertEqual([row.trade_date for row in selected], [date(2020, 1, 23), date(2020, 2, 28)])

    def test_normalize_akshare_rows_uses_chinese_date_and_close_columns(self):
        rows = normalize_akshare_rows([
            {"\u65e5\u671f": "2020-01-02", "\u6536\u76d8": "1.23"},
            {"\u65e5\u671f": "2020-01-03", "\u6536\u76d8": 1.25},
        ], "510300")

        self.assertEqual(rows, [
            PriceRow(date(2020, 1, 2), {"510300": 1.23}),
            PriceRow(date(2020, 1, 3), {"510300": 1.25}),
        ])

    def test_write_wide_price_csv_keeps_only_dates_available_for_all_tickers(self):
        with TemporaryDirectory() as temp_dir:
            output_path = Path(temp_dir) / "prices.csv"

            write_wide_price_csv(output_path, {
                "510300": [
                    PriceRow(date(2020, 1, 2), {"510300": 4.0}),
                    PriceRow(date(2020, 1, 3), {"510300": 4.1}),
                ],
                "518880": [
                    PriceRow(date(2020, 1, 3), {"518880": 3.0}),
                ],
            })

            self.assertEqual(
                output_path.read_text(encoding="utf-8-sig").splitlines(),
                ["date,510300,518880", "2020-01-03,4.1,3.0"],
            )

    def test_translate_header_to_zh_cn_handles_portfolio_metrics(self):
        header = ["date", "total_value", "510300_close", "510300_shares", "510300_value", "510300_weight"]

        translated = translate_header_to_zh_cn(header, ["510300"])

        self.assertEqual(translated, [
            "\u65e5\u671f",
            "\u7ec4\u5408\u603b\u5e02\u503c",
            "510300_\u6536\u76d8\u4ef7",
            "510300_\u6301\u6709\u4efd\u989d",
            "510300_\u6301\u4ed3\u5e02\u503c",
            "510300_\u76ee\u6807\u6743\u91cd",
        ])

    def test_build_monthly_and_yearly_return_records(self):
        records = [
            {"date": "2022-12-30", "total_value": 100.0, "period_return": 0.0, "cumulative_return": 0.0},
            {"date": "2023-01-31", "total_value": 110.0, "period_return": 0.1, "cumulative_return": 0.1},
            {"date": "2023-12-29", "total_value": 121.0, "period_return": 0.1, "cumulative_return": 0.21},
            {"date": "2024-01-31", "total_value": 108.9, "period_return": -0.1, "cumulative_return": 0.089},
        ]

        monthly = build_monthly_return_records(records)
        yearly = build_yearly_return_records(records)

        self.assertEqual(monthly[1]["\u6708\u4efd"], "2023-01")
        self.assertEqual(monthly[1]["\u672c\u6708\u6536\u76ca\u7387\u767e\u5206\u6bd4"], "10.00%")
        self.assertEqual(yearly[1]["\u5e74\u4efd"], "2023")
        self.assertEqual(yearly[1]["\u5e74\u5ea6\u6536\u76ca\u7387\u767e\u5206\u6bd4"], "21.00%")
        self.assertEqual(yearly[2]["\u5e74\u5ea6\u6536\u76ca\u7387\u767e\u5206\u6bd4"], "-10.00%")

    def test_calculate_contribution_totals_sum_to_total_profit(self):
        records = [
            {
                "date": "2020-01-31",
                "total_value": 1000.0,
                "A_close": 10.0,
                "A_shares": 50.0,
                "B_close": 20.0,
                "B_shares": 25.0,
            },
            {
                "date": "2020-02-28",
                "total_value": 1125.0,
                "A_close": 12.0,
                "A_shares": 46.875,
                "B_close": 21.0,
                "B_shares": 26.7857142857,
            },
        ]

        monthly, totals = calculate_contribution_totals(records, ["A", "B"], 1000.0)

        self.assertAlmostEqual(monthly[0]["\u7ec4\u5408\u5f53\u6708\u76c8\u4e8f"], 125.0)
        self.assertAlmostEqual(totals["A"], 100.0)
        self.assertAlmostEqual(totals["B"], 25.0)
        self.assertAlmostEqual(sum(totals.values()), records[-1]["total_value"] - records[0]["total_value"])


if __name__ == "__main__":
    unittest.main()
