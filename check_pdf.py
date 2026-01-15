import PyPDF2

pdf_files = [
    "立替経費精算書_掛屋大志朗_20251203.pdf",
    "立替経費精算書_掛屋大志朗_20251210.pdf"
]

for pdf_file in pdf_files:
    print(f"\n{'='*60}")
    print(f"ファイル: {pdf_file}")
    print('='*60)

    try:
        with open(pdf_file, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            print(f"ページ数: {len(reader.pages)}")

            # 最初のページのテキストを抽出
            if len(reader.pages) > 0:
                text = reader.pages[0].extract_text()
                print(f"\n--- ページ1のテキスト ---")
                print(text[:1000])  # 最初の1000文字
    except Exception as e:
        print(f"エラー: {e}")
