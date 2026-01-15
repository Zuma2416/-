# 🧾 レシート自動入力ツール

レシート画像から情報を自動抽出し、立替経費精算書（Excel）に自動入力するツールです。
OpenAI GPT-4 Vision APIを使用して、高精度なOCRと情報抽出を実現しています。

## ✨ 特徴

- **画像アップロードだけで完結**: レシートをスマホで撮影してアップロードするだけ
- **高精度な情報抽出**: GPT-4 Visionによる日付・店名・金額の自動認識
- **既存フォーマット対応**: お使いの立替経費精算書の書式を維持
- **手動修正可能**: 抽出結果を確認・編集してから登録
- **ローカル実行**: 個人情報をクラウドに保存せず、安全に処理

## 📋 必要要件

- Python 3.9以上
- OpenAI APIキー（GPT-4 Vision APIアクセス権）
- 対応画像形式: JPG, PNG, HEIC
- Excel: 立替経費精算書.xlsx（テンプレート）

## 🚀 セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd receipt-automation
```

### 2. 仮想環境の作成（推奨）

```bash
python -m venv venv

# macOS/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate
```

### 3. 依存パッケージのインストール

```bash
pip install -r requirements.txt
```

### 4. 環境変数の設定

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集してAPIキーを設定
# OPENAI_API_KEY=your_actual_api_key_here
```

### 5. OpenAI APIキーの取得

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. アカウント作成またはログイン
3. API Keysセクションから新しいキーを作成
4. 取得したキーを`.env`ファイルに貼り付け

## 📖 使い方

### アプリケーションの起動

```bash
streamlit run app.py
```

ブラウザで自動的に `http://localhost:8501` が開きます。

### 基本的な使い方

1. **APIキーの設定**
   - 初回起動時、サイドバーでOpenAI APIキーを入力
   - （`.env`ファイルに設定済みの場合は不要）

2. **レシート画像のアップロード**
   - 「レシート登録」タブで画像をアップロード
   - 対応形式: JPG, PNG（最大10MB）

3. **情報の抽出**
   - 「レシート情報を抽出」ボタンをクリック
   - 数秒で日付・支払先・内容・金額が自動抽出されます

4. **データの確認・編集**
   - 抽出結果を確認
   - 必要に応じて手動で修正

5. **Excelへ登録**
   - 「Excelに登録」ボタンで確定
   - 立替経費精算書に自動追記されます

6. **登録済みデータの確認**
   - 「登録済みデータ」タブで一覧表示
   - 合計金額や残り登録可能件数も確認可能

## 📁 プロジェクト構造

```
receipt-automation/
├── app.py                    # Streamlit UI（メインアプリ）
├── excel_handler.py          # Excel操作モジュール
├── receipt_processor.py      # レシート画像処理モジュール
├── requirements.txt          # 依存パッケージ
├── .env.example              # 環境変数サンプル
├── .gitignore                # Git除外設定
├── README.md                 # このファイル
├── templates/
│   └── 立替経費精算書.xlsx   # Excelテンプレート
└── uploads/                  # 一時アップロードフォルダ
```

## 🔧 コマンドラインツール

### Excel操作のテスト

```bash
cd receipt-automation
python excel_handler.py
```

### レシート処理のテスト

```bash
cd receipt-automation
python receipt_processor.py <レシート画像のパス>
```

例:
```bash
python receipt_processor.py test_receipt.jpg
```

## 📊 Excelファイルの構造

ツールは以下の構造の立替経費精算書に対応しています：

- **ヘッダー行**: 10行目
- **データ入力範囲**: 11行目〜26行目（最大16件）
- **列構成**:
  - A列: 日付（YYYY/MM/DD形式）
  - E列: 支払先
  - M列: 支払内容
  - W列: 金額

## 💰 コスト概算

- **OpenAI GPT-4 Vision API**: 約$0.01〜0.03/画像
- **月間20〜30件処理**: 約$0.3〜0.9/月
- **初期費用**: 無料（OpenAIアカウント作成のみ）

## ⚠️ 制約事項

- **登録可能件数**: 1ファイルあたり最大16件
- **画像サイズ**: 最大10MB/枚
- **対応レシート**: 印刷レシート推奨（手書きは60-80%精度）
- **日本語**: 日本語のみ対応

## 🔒 セキュリティ

- **ローカル実行**: 個人情報はローカルマシンで処理
- **API通信**: OpenAI APIとの通信のみ（HTTPS暗号化）
- **画像の自動削除**: 処理後、一時ファイルは自動削除
- **APIキー管理**: `.env`ファイル（Git除外対象）

## 🐛 トラブルシューティング

### Q: APIキーエラーが出る

A: `.env`ファイルでAPIキーが正しく設定されているか確認してください。

### Q: 画像が認識されない

A: 以下を確認してください：
- 画像が鮮明か
- レシート全体が写っているか
- 対応形式（JPG, PNG）か

### Q: 日付が正しく抽出されない

A: 抽出後の編集画面で手動修正できます。

### Q: Excelファイルが開けない

A: `templates/立替経費精算書.xlsx`が存在するか確認してください。

## 🔄 更新履歴

### v1.0.0 (2026-01-15)
- 初回リリース
- 基本機能実装（Phase 1）
  - レシート画像から情報抽出
  - Excelへの自動入力
  - Streamlit UI

## 📝 今後の拡張予定（Phase 2）

- [ ] 複数レシート一括処理
- [ ] 処理結果プレビュー機能
- [ ] 月次ファイル自動生成
- [ ] クレジットカード明細対応
- [ ] Google Vision API対応（コスト削減版）

## 📄 ライセンス

このプロジェクトは個人利用を目的としています。

## 🤝 サポート

問題が発生した場合は、Issueを作成してください。

---

**開発者**: Claude Code
**最終更新**: 2026-01-15
