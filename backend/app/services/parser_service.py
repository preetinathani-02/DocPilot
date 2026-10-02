import fitz
from docx import Document
import pandas as pd
import os

def parse_pdf(file_path):
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text()
    return text


def parse_docx(file_path):
    doc = Document(file_path)
    return "\n".join(
        para.text
        for para in doc.paragraphs
    )


def parse_xlsx(file_path):
    sheets = pd.read_excel(
        file_path,
        sheet_name=None
    )
    text = ""
    for sheet_name, df in sheets.items():
        text += f"\nSheet: {sheet_name}\n"
        text += df.to_string()
    return text

def parse_document(file_path):

    ext = os.path.splitext(
        file_path
    )[1].lower()

    if ext == ".pdf":
        return parse_pdf(file_path)

    if ext == ".docx":
        return parse_docx(file_path)

    if ext == ".xlsx":
        return parse_xlsx(file_path)

    raise Exception(
        "Unsupported file type"
    )