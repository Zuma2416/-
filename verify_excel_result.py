#!/usr/bin/env python3
"""
テスト結果のExcelファイルを検証
"""

import sys
sys.path.insert(0, 'receipt-automation')

from excel_handler import ExpenseExcelHandler

excel_path = "立替経費精算書_テスト結果.xlsx"

print("="*60)
print(f"📊 テスト結果の検証: {excel_path}")
print("="*60)

handler = ExpenseExcelHandler(excel_path)
handler.load()

print("\n📋 登録されている明細:")
print("-"*60)

entries = handler.get_existing_entries()

if entries:
    for entry in entries:
        print(f"行{entry['row']:2d}: {entry['date']} | {entry['payee']:30s} | {entry['content']:30s} | ¥{entry['amount']:>8,.0f}")
else:
    print("(明細なし)")

print("-"*60)
print(f"合計件数: {len(entries)}件")

# セルの値を直接確認
ws = handler.worksheet
print("\n🔍 実際のセル値を確認:")
print(f"  A11 (日付): {ws.cell(11, 1).value}")
print(f"  E11 (支払先): {ws.cell(11, 5).value}")
print(f"  M11 (内容): {ws.cell(11, 13).value}")
print(f"  W11 (金額): {ws.cell(11, 23).value}")

handler.close()

print("\n✅ 検証完了")
