#!/usr/bin/env python3
"""
レシートデータからExcelへの統合テスト
"""

import sys
sys.path.insert(0, 'receipt-automation')

from excel_handler import ExpenseExcelHandler
from datetime import datetime

def test_excel_with_receipt_data():
    """レシートデータを使ってExcelテスト"""

    print("="*60)
    print("📊 レシートデータからExcelへの自動入力テスト")
    print("="*60)

    # レシートから抽出したデータ（モック）
    receipt_data = {
        "date": "2025/12/03",
        "payee": "業務スーパー金町店（シマダヤ）",
        "content": "業務用みそ汁（わかめ・しじみ・あさり）",
        "amount": 3330
    }

    print("\n📸 レシート情報:")
    print(f"  日付: {receipt_data['date']}")
    print(f"  支払先: {receipt_data['payee']}")
    print(f"  支払内容: {receipt_data['content']}")
    print(f"  金額: ¥{receipt_data['amount']:,}")

    # Excelファイルを開く
    excel_path = "receipt-automation/templates/立替経費精算書.xlsx"

    print(f"\n📂 Excelファイルを開く: {excel_path}")

    try:
        handler = ExpenseExcelHandler(excel_path)
        handler.load()

        # 既存データの確認
        print("\n📋 既存の明細:")
        existing = handler.get_existing_entries()
        if existing:
            for entry in existing:
                print(f"  行{entry['row']}: {entry['date']} | {entry['payee']} | ¥{entry['amount']:,}")
        else:
            print("  (なし)")

        # 次の空行
        next_row = handler.find_next_empty_row()
        print(f"\n➡️  次の空行: {next_row}行目")

        # データをバリデーション
        is_valid, error = handler.validate_data(
            receipt_data['date'],
            receipt_data['payee'],
            receipt_data['content'],
            receipt_data['amount']
        )

        if not is_valid:
            print(f"\n❌ バリデーションエラー: {error}")
            return False

        print("\n✅ バリデーション成功")

        # データを追加
        print("\n💾 Excelにデータを追加中...")
        success, message = handler.add_expense_entry(
            receipt_data['date'],
            receipt_data['payee'],
            receipt_data['content'],
            receipt_data['amount']
        )

        if success:
            print(f"✅ {message}")

            # 作業ファイルとして保存
            output_path = "立替経費精算書_テスト結果.xlsx"
            handler.save(output_path)
            print(f"\n💾 保存完了: {output_path}")

            # 追加後のデータを確認
            print("\n📋 追加後の明細:")
            entries = handler.get_existing_entries()
            for entry in entries:
                print(f"  行{entry['row']}: {entry['date']} | {entry['payee']} | ¥{entry['amount']:,}")

            total = handler.get_total_amount()
            print(f"\n💰 合計金額: ¥{total:,}")

        else:
            print(f"❌ エラー: {message}")
            return False

        handler.close()

        print("\n" + "="*60)
        print("🎉 テスト成功！レシートデータがExcelに正しく追加されました")
        print("="*60)

        return True

    except Exception as e:
        print(f"\n❌ エラーが発生しました: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_excel_with_receipt_data()
    sys.exit(0 if success else 1)
