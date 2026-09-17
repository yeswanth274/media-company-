import pytest
import os
import tempfile
from app.ingestion.extractors import TextExtractor, HTMLExtractor, CSVExtractor, get_extractor_for_file
from app.ingestion.cleaner import cleaner

def test_cleaner_normalizes_text():
    dirty = "This   is \r\n  a \t  test \u00a0 with  \n\n\n multiple breaks."
    cleaned = cleaner.clean(dirty)
    assert "This is" in cleaned
    assert "\r" not in cleaned
    assert "\n\n\n" not in cleaned

def test_text_extractor():
    with tempfile.NamedTemporaryFile("w+", suffix=".txt", delete=False) as f:
        f.write("Line 1\nLine 2 about Northstar Technologies investigation.")
        f_path = f.name
    
    try:
        extractor = TextExtractor()
        result = extractor.extract(f_path)
        assert "Northstar Technologies" in result.raw_text
        assert len(result.pages) == 1
    finally:
        if os.path.exists(f_path):
            os.remove(f_path)

def test_html_extractor():
    with tempfile.NamedTemporaryFile("w+", suffix=".html", delete=False) as f:
        f.write("<html><head><title>Test Article</title></head><body><h1>Heading</h1><p>Content text</p></body></html>")
        f_path = f.name

    try:
        extractor = HTMLExtractor()
        result = extractor.extract(f_path)
        assert "Content text" in result.raw_text
        assert result.metadata["title"] == "Test Article"
    finally:
        if os.path.exists(f_path):
            os.remove(f_path)
