#!/usr/bin/env python3
"""
フル動作テスト前のセットアップ確認
"""

import sys
import os
from pathlib import Path

def check_setup():
    """セットアップ状態をチェック"""

    print("="*70)
    print("🔍 レシート自動入力ツール - セットアップ確認")
    print("="*70)

    all_ok = True

    # 1. ファイル存在チェック
    print("\n📁 必要なファイルの確認:")
    required_files = [
        "app.py",
        "excel_handler.py",
        "receipt_processor.py",
        "requirements.txt",
        ".env.example",
        "templates/立替経費精算書.xlsx"
    ]

    for file in required_files:
        exists = Path(file).exists()
        status = "✅" if exists else "❌"
        print(f"  {status} {file}")
        if not exists:
            all_ok = False

    # 2. 環境変数チェック
    print("\n🔑 環境変数の確認:")
    env_file = Path(".env")
    if env_file.exists():
        print("  ✅ .env ファイルが存在します")

        # APIキーの確認
        from dotenv import load_dotenv
        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")

        if api_key and api_key.startswith("sk-"):
            print(f"  ✅ OpenAI APIキーが設定されています ({api_key[:20]}...)")
        else:
            print("  ❌ OpenAI APIキーが正しく設定されていません")
            all_ok = False
    else:
        print("  ⚠️  .env ファイルがありません")
        print("     .env.example をコピーして .env を作成し、APIキーを設定してください")
        all_ok = False

    # 3. 依存パッケージチェック
    print("\n📦 依存パッケージの確認:")
    packages = {
        "openpyxl": ("openpyxl", "Excel操作"),
        "python-dotenv": ("dotenv", "環境変数管理"),
        "pillow": ("PIL", "画像処理"),
        "openai": ("openai", "OpenAI API"),
        "streamlit": ("streamlit", "Web UI")
    }

    for package_name, (import_name, description) in packages.items():
        try:
            __import__(import_name)
            print(f"  ✅ {package_name:20s} ({description})")
        except ImportError:
            print(f"  ❌ {package_name:20s} ({description}) - インストールが必要")
            all_ok = False

    # 4. Pythonバージョンチェック
    print("\n🐍 Python バージョン:")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 9:
        print(f"  ✅ Python {version.major}.{version.minor}.{version.micro}")
    else:
        print(f"  ❌ Python {version.major}.{version.minor}.{version.micro} (3.9以上が必要)")
        all_ok = False

    # 結果
    print("\n" + "="*70)
    if all_ok:
        print("✅ すべての準備が整っています！")
        print("\n次のコマンドでアプリを起動できます:")
        print("  streamlit run app.py")
    else:
        print("⚠️  いくつかの問題があります。上記の指示に従って修正してください。")
        print("\n修正後、再度このスクリプトを実行してください:")
        print("  python setup_check.py")
    print("="*70)

    return all_ok

if __name__ == "__main__":
    success = check_setup()
    sys.exit(0 if success else 1)
