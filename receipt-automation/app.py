"""
レシート自動入力ツール - Streamlit UI
"""

import streamlit as st
import os
from pathlib import Path
from datetime import datetime
import shutil
from dotenv import load_dotenv

from excel_handler import ExpenseExcelHandler
from receipt_processor import ReceiptProcessor

# 環境変数読み込み
load_dotenv()

# ページ設定
st.set_page_config(
    page_title="レシート自動入力ツール",
    page_icon="🧾",
    layout="wide"
)

# セッション状態の初期化
if "processed_data" not in st.session_state:
    st.session_state.processed_data = None
if "excel_path" not in st.session_state:
    st.session_state.excel_path = None


def initialize_excel():
    """Excelファイルの初期化"""
    template_path = Path("templates/立替経費精算書.xlsx")

    # テンプレートが存在するか確認
    if not template_path.exists():
        st.error("テンプレートファイルが見つかりません")
        return None

    # 作業用ファイルのパス
    year_month = datetime.now().strftime("%Y%m")
    work_file = Path(f"立替経費精算書_{year_month}.xlsx")

    # 既存ファイルがない場合はテンプレートをコピー
    if not work_file.exists():
        shutil.copy(template_path, work_file)
        st.info(f"新規ファイルを作成しました: {work_file.name}")

    return str(work_file)


def main():
    st.title("🧾 レシート自動入力ツール")
    st.markdown("---")

    # サイドバー: 設定
    with st.sidebar:
        st.header("⚙️ 設定")

        # APIキー設定
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            api_key = st.text_input(
                "OpenAI APIキー",
                type="password",
                help="OpenAI APIキーを入力してください"
            )
            if api_key:
                os.environ["OPENAI_API_KEY"] = api_key

        # Excelファイルの状態
        st.markdown("---")
        st.subheader("📊 Excelファイル")

        excel_path = initialize_excel()
        if excel_path:
            st.session_state.excel_path = excel_path
            st.success(f"使用中: {Path(excel_path).name}")

            # 既存データの表示
            try:
                handler = ExpenseExcelHandler(excel_path)
                handler.load()
                entries = handler.get_existing_entries()
                total = handler.get_total_amount()
                handler.close()

                st.metric("登録済み件数", f"{len(entries)}件")
                st.metric("合計金額", f"¥{total:,.0f}")
                st.metric("残り登録可能", f"{16 - len(entries)}件")

            except Exception as e:
                st.error(f"エラー: {str(e)}")

    # メインエリア
    if not api_key:
        st.warning("⚠️ OpenAI APIキーを設定してください（サイドバー）")
        st.info("""
        ### APIキーの取得方法
        1. [OpenAI Platform](https://platform.openai.com/) にアクセス
        2. アカウントを作成またはログイン
        3. API Keys セクションから新しいキーを作成
        4. 取得したキーを左側のサイドバーに入力
        """)
        return

    # タブで機能を分割
    tab1, tab2 = st.tabs(["📤 レシート登録", "📋 登録済みデータ"])

    # タブ1: レシート登録
    with tab1:
        st.header("レシート画像をアップロード")

        uploaded_file = st.file_uploader(
            "レシート画像を選択",
            type=["jpg", "jpeg", "png"],
            help="対応形式: JPG, PNG（最大10MB）"
        )

        if uploaded_file:
            col1, col2 = st.columns([1, 1])

            with col1:
                st.subheader("📸 アップロード画像")
                st.image(uploaded_file, use_container_width=True)

            with col2:
                st.subheader("🔍 抽出結果")

                if st.button("🚀 レシート情報を抽出", type="primary"):
                    with st.spinner("画像を解析中..."):
                        # 一時ファイルとして保存
                        temp_dir = Path("uploads")
                        temp_dir.mkdir(exist_ok=True)
                        temp_file = temp_dir / uploaded_file.name

                        with open(temp_file, "wb") as f:
                            f.write(uploaded_file.getbuffer())

                        try:
                            # レシート処理
                            processor = ReceiptProcessor(api_key=api_key)
                            success, data, message = processor.process_receipt_to_expense(str(temp_file))

                            if success:
                                st.session_state.processed_data = data
                                st.success(message)

                                # 抽出データを表示
                                st.write("**日付:**", data["date"])
                                st.write("**支払先:**", data["payee"])
                                st.write("**支払内容:**", data["content"])
                                st.write("**金額:**", f"¥{data['amount']:,.0f}")

                            else:
                                st.error(message)

                        except Exception as e:
                            st.error(f"エラーが発生しました: {str(e)}")

                        finally:
                            # 一時ファイルを削除
                            if temp_file.exists():
                                temp_file.unlink()

                # データが抽出されている場合、編集・登録
                if st.session_state.processed_data:
                    st.markdown("---")
                    st.subheader("✏️ データの確認・編集")

                    data = st.session_state.processed_data

                    # 編集フォーム
                    with st.form("edit_form"):
                        edited_date = st.text_input("日付", value=data["date"])
                        edited_payee = st.text_input("支払先", value=data["payee"])
                        edited_content = st.text_input("支払内容", value=data["content"])
                        edited_amount = st.number_input(
                            "金額",
                            value=float(data["amount"]),
                            min_value=0.0,
                            step=1.0
                        )

                        col_btn1, col_btn2 = st.columns(2)
                        with col_btn1:
                            submit = st.form_submit_button("💾 Excelに登録", type="primary")
                        with col_btn2:
                            cancel = st.form_submit_button("❌ キャンセル")

                        if submit:
                            try:
                                handler = ExpenseExcelHandler(st.session_state.excel_path)
                                handler.load()

                                # バリデーション
                                is_valid, error_msg = handler.validate_data(
                                    edited_date,
                                    edited_payee,
                                    edited_content,
                                    edited_amount
                                )

                                if not is_valid:
                                    st.error(error_msg)
                                else:
                                    # 登録
                                    success, message = handler.add_expense_entry(
                                        edited_date,
                                        edited_payee,
                                        edited_content,
                                        edited_amount
                                    )

                                    if success:
                                        handler.save()
                                        st.success(f"✅ {message}")
                                        st.session_state.processed_data = None
                                        st.rerun()
                                    else:
                                        st.error(message)

                                handler.close()

                            except Exception as e:
                                st.error(f"登録エラー: {str(e)}")

                        if cancel:
                            st.session_state.processed_data = None
                            st.rerun()

    # タブ2: 登録済みデータ
    with tab2:
        st.header("登録済みデータ一覧")

        if st.session_state.excel_path:
            try:
                handler = ExpenseExcelHandler(st.session_state.excel_path)
                handler.load()
                entries = handler.get_existing_entries()
                total = handler.get_total_amount()
                handler.close()

                if entries:
                    # データフレームで表示
                    import pandas as pd

                    df = pd.DataFrame(entries)
                    df["金額"] = df["amount"].apply(lambda x: f"¥{x:,.0f}")
                    df_display = df[["date", "payee", "content", "金額"]]
                    df_display.columns = ["日付", "支払先", "支払内容", "金額"]

                    st.dataframe(df_display, use_container_width=True)

                    st.markdown("---")
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.metric("総件数", f"{len(entries)}件")
                    with col2:
                        st.metric("合計金額", f"¥{total:,.0f}")
                    with col3:
                        st.metric("残り登録可能", f"{16 - len(entries)}件")

                else:
                    st.info("まだデータが登録されていません")

            except Exception as e:
                st.error(f"データの読み込みエラー: {str(e)}")


if __name__ == "__main__":
    main()
