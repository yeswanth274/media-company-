import os
import re
import csv
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.ingestion.cleaner import cleaner
from app.utils.logging import logger

MONTH_MAP = {
    'january': 1, 'jan': 1,
    'february': 2, 'feb': 2,
    'march': 3, 'mar': 3,
    'april': 4, 'apr': 4,
    'may': 5,
    'june': 6, 'jun': 6,
    'july': 7, 'jul': 7,
    'august': 8, 'aug': 8,
    'september': 9, 'sep': 9, 'sept': 9,
    'october': 10, 'oct': 10,
    'november': 11, 'nov': 11,
    'december': 12, 'dec': 12
}

MONTHS_REGEX = r"(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)"

def parse_pdf_creation_date(date_str: Optional[str]) -> Optional[str]:
    """Parses PDF creation date format e.g. 'D:20241022143000Z' or 'D:20241022' into YYYY-MM-DD."""
    if not date_str:
        return None
    cleaned = str(date_str).strip()
    if cleaned.startswith("D:"):
        cleaned = cleaned[2:]
    match = re.match(r"^(\d{4})(\d{2})(\d{2})", cleaned)
    if match:
        year, month, day = match.groups()
        try:
            d = datetime(int(year), int(month), int(day))
            return d.strftime("%Y-%m-%d")
        except Exception:
            pass
    return None

def extract_date_from_text(text: str, filename: Optional[str] = None) -> Optional[str]:
    """
    Extracts publication date from document text or filename.
    Returns normalized YYYY-MM-DD string.
    """
    if not text and not filename:
        return None

    sample_text = text[:4000] if text else ""

    # 1. Look for 'Month Day, Year' e.g. 'October 22, 2024', 'September 14, 2015'
    m = re.search(rf"\b({MONTHS_REGEX})\.?\s+(\d{{1,2}})(?:st|nd|rd|th)?,?\s+(\d{{4}})\b", sample_text, re.IGNORECASE)
    if m:
        month_str, day_str, year_str = m.group(1), m.group(2), m.group(3)
        month_num = MONTH_MAP.get(month_str.lower())
        if month_num:
            try:
                d = datetime(int(year_str), month_num, int(day_str))
                return d.strftime("%Y-%m-%d")
            except Exception:
                pass

    # 2. Look for 'Day Month Year' e.g. '22 October 2024', '14 Sep 2015'
    m = re.search(rf"\b(\d{{1,2}})(?:st|nd|rd|th)?\s+({MONTHS_REGEX})\.?,?\s+(\d{{4}})\b", sample_text, re.IGNORECASE)
    if m:
        day_str, month_str, year_str = m.group(1), m.group(2), m.group(3)
        month_num = MONTH_MAP.get(month_str.lower())
        if month_num:
            try:
                d = datetime(int(year_str), month_num, int(day_str))
                return d.strftime("%Y-%m-%d")
            except Exception:
                pass

    # 3. Look for ISO dates e.g. '2024-10-22', '2024/10/22'
    m = re.search(r"\b(19\d\d|20\d\d)[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])\b", sample_text)
    if m:
        year_str, month_str, day_str = m.group(1), m.group(2), m.group(3)
        try:
            d = datetime(int(year_str), int(month_str), int(day_str))
            return d.strftime("%Y-%m-%d")
        except Exception:
            pass

    # 4. Look for 'Month Year' e.g. 'October 2016', 'April 2021'
    m = re.search(rf"\b({MONTHS_REGEX})\.?\s+(\d{{4}})\b", sample_text, re.IGNORECASE)
    if m:
        month_str, year_str = m.group(1), m.group(2)
        month_num = MONTH_MAP.get(month_str.lower())
        if month_num:
            try:
                d = datetime(int(year_str), month_num, 1)
                return d.strftime("%Y-%m-%d")
            except Exception:
                pass

    # 5. Look for date in filename (e.g. article_2015_northstar_launch.md or report_2024-10-22.pdf)
    if filename:
        m = re.search(r"(19\d\d|20\d\d)[-_](0[1-9]|1[0-2])[-_](0[1-9]|[12]\d|3[01])", filename)
        if m:
            try:
                d = datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)))
                return d.strftime("%Y-%m-%d")
            except Exception:
                pass
        
        m_year = re.search(r"\b(19\d\d|20\d\d)\b", filename)
        if m_year:
            return f"{m_year.group(1)}-01-01"

    # 6. Look for standalone 4-digit year in early text
    m_year = re.search(r"\b(19\d\d|20\d\d)\b", sample_text[:1000])
    if m_year:
        return f"{m_year.group(1)}-01-01"

    return None

def extract_metadata_from_text(raw_text: str, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Intelligently extracts Title, Author, Publication, Publication Date, and Location from document text.
    """
    metadata: Dict[str, Any] = {}
    if not raw_text:
        return metadata

    lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
    if not lines:
        return metadata

    # 1. Headline / Title extraction
    title = None
    for line in lines[:5]:
        # Markdown H1 / H2
        if line.startswith("# "):
            title = line.lstrip("# ").strip()
            break
        elif line.startswith("## "):
            title = line.lstrip("# ").strip()
            break
        # All caps or prominent title line
        elif len(line) > 10 and not line.lower().startswith("by ") and not line.lower().startswith("date:"):
            if not title:
                title = line.strip()
    
    if title:
        metadata["title"] = title

    # 2. Date extraction
    pub_date = extract_date_from_text(raw_text, filename)
    if pub_date:
        metadata["publication_date"] = pub_date

    # 3. Byline extraction: e.g. "**By David Rivera | Investigative Dispatch | October 22, 2024**"
    for line in lines[:10]:
        # Strip markdown bolding/italics
        clean_line = re.sub(r"[\*_]", "", line).strip()
        
        # Pattern: By Author | Publication | Date or By Author, Publication
        byline_match = re.search(r"^(?:By|Reported by|Author:)\s+([^,|—\n]+)(?:[|,—]\s*([^,|—\n]+))?", clean_line, re.IGNORECASE)
        if byline_match:
            author = byline_match.group(1).strip()
            if author and len(author) < 60 and not metadata.get("author"):
                metadata["author"] = author
            
            pub = byline_match.group(2)
            if pub:
                pub = pub.strip()
                # Ensure it's not a date
                if not re.search(rf"\b({MONTHS_REGEX}|\d{{4}})\b", pub, re.IGNORECASE) and not metadata.get("publication"):
                    metadata["publication"] = pub

        # Pattern: Interview with Elena Rostova
        interview_match = re.search(r"^Interview with\s+([^,\n]+)", clean_line, re.IGNORECASE)
        if interview_match and not metadata.get("author"):
            metadata["author"] = interview_match.group(1).strip()

        # Location Datelines e.g. "METRO CITY —" or "STATE CAPITAL —"
        loc_match = re.search(r"^([A-Z\s]{4,30})\s*(?:—|–|-)\s*", clean_line)
        if loc_match and not metadata.get("location"):
            loc = loc_match.group(1).strip()
            if loc not in ["NOTE", "TRANSCRIPT", "CONFIDENTIAL", "MEMORANDUM"]:
                metadata["location"] = loc.title()

    return metadata


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
        import pymupdf  # PyMuPDF
        doc = pymupdf.open(file_path)
        pages: List[DocumentPage] = []
        all_text_parts = []
        doc_metadata: Dict[str, Any] = {}

        try:
            pdf_meta = doc.metadata or {}
            raw_pdf_title = (pdf_meta.get("title") or "").strip()
            # If PDF title is generic (e.g. "Untitled document"), ignore it so text extraction picks up the actual headline
            if raw_pdf_title and not raw_pdf_title.lower().startswith("untitled") and not raw_pdf_title.lower().startswith("document"):
                doc_metadata["title"] = raw_pdf_title
            
            if pdf_meta.get("author"):
                doc_metadata["author"] = pdf_meta.get("author")
            
            parsed_creation_date = parse_pdf_creation_date(pdf_meta.get("creationDate") or pdf_meta.get("modDate"))
            if parsed_creation_date:
                doc_metadata["creation_date"] = parsed_creation_date
                doc_metadata["publication_date"] = parsed_creation_date

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
        
        # Enrich with smart text metadata extraction
        text_meta = extract_metadata_from_text(raw_text, Path(file_path).name)
        for k, v in text_meta.items():
            if v and (not doc_metadata.get(k) or (k == "title" and not doc_metadata.get("title"))):
                doc_metadata[k] = v

        if not doc_metadata.get("title"):
            doc_metadata["title"] = Path(file_path).stem.replace("_", " ").replace("-", " ").title()

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
        
        doc_metadata: Dict[str, Any] = {
            "title": Path(file_path).stem.replace("_", " ").replace("-", " ").title(),
            "author": getattr(doc.core_properties, "author", None),
        }

        created_dt = getattr(doc.core_properties, "created", None)
        if created_dt and isinstance(created_dt, datetime):
            doc_metadata["creation_date"] = created_dt.strftime("%Y-%m-%d")
            doc_metadata["publication_date"] = created_dt.strftime("%Y-%m-%d")

        text_meta = extract_metadata_from_text(raw_text, Path(file_path).name)
        for k, v in text_meta.items():
            if v and (not doc_metadata.get(k) or k == "title"):
                doc_metadata[k] = v

        return ExtractorResult(pages=pages, raw_text=raw_text, metadata=doc_metadata)

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

        metadata: Dict[str, Any] = {"title": str(title).strip()}
        text_meta = extract_metadata_from_text(cleaned, Path(file_path).name)
        for k, v in text_meta.items():
            if v and (not metadata.get(k) or k == "title"):
                metadata[k] = v

        pages = [DocumentPage(text=cleaned, page_number=1)]
        return ExtractorResult(pages=pages, raw_text=cleaned, metadata=metadata)

class TextExtractor(BaseExtractor):
    def extract(self, file_path: str) -> ExtractorResult:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            raw = f.read()

        cleaned = cleaner.clean(raw)
        metadata: Dict[str, Any] = {"title": Path(file_path).stem.replace("_", " ").replace("-", " ").title()}
        text_meta = extract_metadata_from_text(cleaned, Path(file_path).name)
        for k, v in text_meta.items():
            if v and (not metadata.get(k) or k == "title"):
                metadata[k] = v

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
        metadata: Dict[str, Any] = {"title": Path(file_path).stem.replace("_", " ").replace("-", " ").title()}
        text_meta = extract_metadata_from_text(cleaned, Path(file_path).name)
        for k, v in text_meta.items():
            if v:
                metadata[k] = v

        pages = [DocumentPage(text=cleaned, page_number=1)]
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
        return TextExtractor()
