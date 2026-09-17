import os
import csv
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.ingestion.cleaner import cleaner
from app.utils.logging import logger

class DocumentPage:
    def __init__(self, text: str, page_number: Optional[int] = None, timestamp_start: Optional[str] = None, timestamp_end: Optional[str] = None):
        self.text = text
        self.page_number = page_number
        self.timestamp_start = timestamp_start
        self.timestamp_end = timestamp_end

class ExtractorResult:
    def __init__(self, pages: List[DocumentPage], raw_text: str, metadata: Dict[str, Any]):
        self.pages = pages
        self.raw_text = raw_text
        self.metadata = metadata

class BaseExtractor:
    def extract(self, file_path: str) -> ExtractorResult:
        raise NotImplementedError

class PDFExtractor(BaseExtractor):
    def extract(self, file_path: str) -> ExtractorResult:
        import fitz  # PyMuPDF
        doc = fitz.open(file_path)
        pages: List[DocumentPage] = []
        all_text_parts = []
        doc_metadata = {}

        try:
            pdf_meta = doc.metadata or {}
            doc_metadata["title"] = pdf_meta.get("title") or Path(file_path).stem
            doc_metadata["author"] = pdf_meta.get("author")
            doc_metadata["creation_date"] = pdf_meta.get("creationDate")

            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text("text")
                cleaned = cleaner.clean(text)
                if cleaned:
                    pages.append(DocumentPage(text=cleaned, page_number=page_num + 1))
                    all_text_parts.append(cleaned)
        finally:
            doc.close()

        raw_text = "\n\n".join(all_text_parts)
        return ExtractorResult(pages=pages, raw_text=raw_text, metadata=doc_metadata)

class DocxExtractor(BaseExtractor):
    def extract(self, file_path: str) -> ExtractorResult:
        import docx
        doc = docx.Document(file_path)
        paragraphs = []
        for p in doc.paragraphs:
            text = cleaner.clean(p.text)
            if text:
                paragraphs.append(text)

        raw_text = "\n\n".join(paragraphs)
        pages = [DocumentPage(text=raw_text, page_number=1)]
        metadata = {
            "title": Path(file_path).stem,
            "author": getattr(doc.core_properties, "author", None),
        }
        return ExtractorResult(pages=pages, raw_text=raw_text, metadata=metadata)

class HTMLExtractor(BaseExtractor):
    def extract(self, file_path: str) -> ExtractorResult:
        from bs4 import BeautifulSoup
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            html_content = f.read()

        soup = BeautifulSoup(html_content, "html.parser")

        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.extract()

        title = soup.title.string if soup.title else Path(file_path).stem
        text = soup.get_text(separator="\n\n")
        cleaned = cleaner.clean(text)

        metadata = {"title": str(title).strip()}
        pages = [DocumentPage(text=cleaned, page_number=1)]
        return ExtractorResult(pages=pages, raw_text=cleaned, metadata=metadata)

class TextExtractor(BaseExtractor):
    def extract(self, file_path: str) -> ExtractorResult:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw = f.read()

        cleaned = cleaner.clean(raw)
        title = Path(file_path).stem
        metadata = {"title": title}
        pages = [DocumentPage(text=cleaned, page_number=1)]
        return ExtractorResult(pages=pages, raw_text=cleaned, metadata=metadata)

class CSVExtractor(BaseExtractor):
    def extract(self, file_path: str) -> ExtractorResult:
        rows_text = []
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            reader = csv.reader(f)
            header = None
            for row in reader:
                if not header:
                    header = row
                    continue
                row_str = " | ".join(f"{h}: {val}" for h, val in zip(header, row) if val)
                if row_str.strip():
                    rows_text.append(row_str)

        raw_text = "\n".join(rows_text)
        cleaned = cleaner.clean(raw_text)
        pages = [DocumentPage(text=cleaned, page_number=1)]
        metadata = {"title": Path(file_path).stem}
        return ExtractorResult(pages=pages, raw_text=cleaned, metadata=metadata)

def get_extractor_for_file(file_path: str) -> BaseExtractor:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        return PDFExtractor()
    elif ext in [".docx", ".doc"]:
        return DocxExtractor()
    elif ext in [".html", ".htm"]:
        return HTMLExtractor()
    elif ext == ".csv":
        return CSVExtractor()
    elif ext in [".txt", ".md", ".json"]:
        return TextExtractor()
    else:
        # Default fallback to TextExtractor
        return TextExtractor()
