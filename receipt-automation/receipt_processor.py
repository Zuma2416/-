"""
レシート画像処理モジュール
OpenAI GPT-4 Vision APIを使用してレシート情報を抽出
"""

import os
import base64
import json
from pathlib import Path
from typing import Dict, Optional, Tuple
from datetime import datetime
import openai
from PIL import Image
import io


class ReceiptProcessor:
    """レシート画像処理クラス"""

    def __init__(self, api_key: Optional[str] = None):
        """
        初期化

        Args:
            api_key: OpenAI APIキー（Noneの場合は環境変数から取得）
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI APIキーが設定されていません")

        openai.api_key = self.api_key

    def encode_image(self, image_path: str) -> str:
        """
        画像をbase64エンコード

        Args:
            image_path: 画像ファイルのパス

        Returns:
            base64エンコードされた画像
        """
        with open(image_path, "rb") as image_file:
            return base64.b64encode(image_file.read()).decode("utf-8")

    def validate_image(self, image_path: str) -> Tuple[bool, str]:
        """
        画像ファイルをバリデーション

        Args:
            image_path: 画像ファイルのパス

        Returns:
            (有効フラグ, エラーメッセージ)
        """
        image_path = Path(image_path)

        # ファイル存在チェック
        if not image_path.exists():
            return False, "ファイルが見つかりません"

        # 拡張子チェック
        valid_extensions = [".jpg", ".jpeg", ".png", ".heic"]
        if image_path.suffix.lower() not in valid_extensions:
            return False, f"対応していない画像形式です（対応形式: {', '.join(valid_extensions)}）"

        # ファイルサイズチェック（10MB）
        file_size_mb = image_path.stat().st_size / (1024 * 1024)
        if file_size_mb > 10:
            return False, f"ファイルサイズが大きすぎます（{file_size_mb:.1f}MB > 10MB）"

        # 画像として開けるかチェック
        try:
            with Image.open(image_path) as img:
                img.verify()
        except Exception as e:
            return False, f"画像ファイルが破損しています: {str(e)}"

        return True, ""

    def extract_receipt_info(self, image_path: str) -> Tuple[bool, Dict, str]:
        """
        レシート画像から情報を抽出

        Args:
            image_path: 画像ファイルのパス

        Returns:
            (成功フラグ, 抽出データ, エラーメッセージ)
        """
        # バリデーション
        is_valid, error_msg = self.validate_image(image_path)
        if not is_valid:
            return False, {}, error_msg

        try:
            # 画像をbase64エンコード
            base64_image = self.encode_image(image_path)

            # OpenAI APIに送信
            client = openai.OpenAI(api_key=self.api_key)

            response = client.chat.completions.create(
                model="gpt-4o",  # 最新のVision対応モデル
                messages=[
                    {
                        "role": "system",
                        "content": """あなたはレシート情報抽出の専門家です。
レシート画像から以下の情報を正確に抽出してJSON形式で返してください。

必須フィールド:
- date: 日付（YYYY/MM/DD形式）
- payee: 支払先/店舗名
- content: 支払内容/品目（複数ある場合はカンマ区切り）
- amount: 合計金額（数値のみ）

注意事項:
- 日付が不明な場合は今日の日付を使用
- 金額は消費税込みの合計金額を抽出
- 支払先は正式な店舗名を使用
- 支払内容は簡潔に（例: 文房具、交通費、飲食費など）"""
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "このレシートから日付、支払先、支払内容、金額を抽出してJSON形式で返してください。"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=500,
                temperature=0.1  # 精度優先
            )

            # レスポンスからJSON抽出
            response_text = response.choices[0].message.content

            # JSONブロックを抽出（```json ... ``` の中身）
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                json_text = response_text[json_start:json_end].strip()
            else:
                json_text = response_text

            # JSONパース
            data = json.loads(json_text)

            # データ検証
            required_fields = ["date", "payee", "content", "amount"]
            for field in required_fields:
                if field not in data:
                    return False, {}, f"必須フィールド '{field}' が見つかりません"

            # 日付形式の正規化
            date_str = str(data["date"])
            try:
                # 様々な日付形式に対応
                if "/" in date_str:
                    date_obj = datetime.strptime(date_str, "%Y/%m/%d")
                elif "-" in date_str:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                else:
                    date_obj = datetime.now()

                data["date"] = date_obj.strftime("%Y/%m/%d")
            except ValueError:
                # パースできない場合は今日の日付
                data["date"] = datetime.now().strftime("%Y/%m/%d")

            # 金額を数値に変換
            try:
                amount_str = str(data["amount"]).replace(",", "").replace("¥", "").replace("円", "").strip()
                data["amount"] = float(amount_str)
            except ValueError:
                return False, {}, f"金額の変換に失敗しました: {data['amount']}"

            return True, data, ""

        except openai.APIError as e:
            return False, {}, f"OpenAI APIエラー: {str(e)}"
        except Exception as e:
            return False, {}, f"予期しないエラー: {str(e)}"

    def process_receipt_to_expense(self, image_path: str) -> Tuple[bool, Dict, str]:
        """
        レシート画像を処理して経費データに変換

        Args:
            image_path: 画像ファイルのパス

        Returns:
            (成功フラグ, 経費データ, メッセージ)
        """
        success, data, error_msg = self.extract_receipt_info(image_path)

        if not success:
            return False, {}, error_msg

        # 経費データに整形
        expense_data = {
            "date": data["date"],
            "payee": data["payee"][:30],  # 30文字制限
            "content": data["content"],
            "amount": data["amount"]
        }

        return True, expense_data, "レシート情報の抽出に成功しました"


def test_receipt_processor():
    """テスト関数"""
    import sys

    if len(sys.argv) < 2:
        print("使用方法: python receipt_processor.py <レシート画像のパス>")
        return

    processor = ReceiptProcessor()
    image_path = sys.argv[1]

    print(f"レシート画像を処理中: {image_path}")
    success, data, message = processor.process_receipt_to_expense(image_path)

    if success:
        print("\n=== 抽出結果 ===")
        print(f"日付: {data['date']}")
        print(f"支払先: {data['payee']}")
        print(f"支払内容: {data['content']}")
        print(f"金額: ¥{data['amount']:,.0f}")
    else:
        print(f"\nエラー: {message}")


if __name__ == "__main__":
    test_receipt_processor()
