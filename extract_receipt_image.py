#!/usr/bin/env python3
"""
PDFからレシート画像を抽出
"""

import fitz  # PyMuPDF
from PIL import Image
import io

def extract_receipt_from_pdf(pdf_path, output_path):
    """
    PDFからレシート画像を抽出

    Args:
        pdf_path: PDFファイルのパス
        output_path: 出力画像のパス
    """
    print(f"📄 PDFを開く: {pdf_path}")

    # PDFを開く
    doc = fitz.open(pdf_path)

    print(f"   ページ数: {len(doc)}")

    # 2ページ目を取得（0-indexed なので page 1）
    if len(doc) < 2:
        print("❌ 2ページ目が見つかりません")
        return False

    page = doc[1]  # 2ページ目

    # ページを画像に変換（高解像度）
    zoom = 2  # 解像度を2倍に
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat)

    # 画像として保存
    img_data = pix.tobytes("png")

    with open(output_path, "wb") as f:
        f.write(img_data)

    print(f"✅ レシート画像を抽出: {output_path}")
    print(f"   サイズ: {pix.width} x {pix.height} px")

    doc.close()
    return True


if __name__ == "__main__":
    pdf_file = "立替経費精算書_掛屋大志朗_20251203.pdf"
    output_file = "receipt_sample_20251203.png"

    success = extract_receipt_from_pdf(pdf_file, output_file)

    if success:
        print(f"\n🎉 レシート画像の抽出が完了しました")
        print(f"   出力ファイル: {output_file}")
