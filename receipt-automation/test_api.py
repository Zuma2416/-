#!/usr/bin/env python3
"""
OpenAI API接続テスト
"""

import os
from dotenv import load_dotenv
import openai

# 環境変数読み込み
load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("❌ APIキーが設定されていません")
    exit(1)

print(f"✅ APIキーを検出: {api_key[:20]}...")

# APIテスト
try:
    print("\n🔍 OpenAI APIに接続中...")
    client = openai.OpenAI(api_key=api_key)

    # 簡単なテストリクエスト
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": "Hello! Just testing the API. Reply with 'OK'."}
        ],
        max_tokens=10
    )

    reply = response.choices[0].message.content
    print(f"✅ API接続成功！")
    print(f"   レスポンス: {reply}")
    print(f"\n🎉 OpenAI API (GPT-4 Vision) が正常に動作しています！")

except openai.AuthenticationError:
    print("❌ 認証エラー: APIキーが無効です")
except openai.RateLimitError:
    print("❌ レート制限エラー: 課金設定を確認してください")
except Exception as e:
    print(f"❌ エラー: {str(e)}")
