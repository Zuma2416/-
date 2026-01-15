#!/bin/bash
# レシート自動入力ツール - 起動スクリプト

echo "🧾 レシート自動入力ツール"
echo "================================"
echo ""

# セットアップチェック
echo "📋 セットアップを確認中..."
python3 setup_check.py

if [ $? -eq 0 ]; then
    echo ""
    echo "🚀 Streamlitアプリを起動します..."
    echo "   ブラウザが自動で開きます"
    echo "   終了するには Ctrl+C を押してください"
    echo ""
    streamlit run app.py
else
    echo ""
    echo "❌ セットアップに問題があります"
    echo "   上記のメッセージを確認して修正してください"
    exit 1
fi
