import re
import unicodedata

class TextCleaner:
    @staticmethod
    def clean(text: str) -> str:
        if not text:
            return ""

        # Normalize unicode
        text = unicodedata.normalize("NFKC", text)

        # Replace non-breaking spaces and other odd spaces with normal space
        text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")

        # Replace carriage returns
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        # Remove control characters except standard whitespace (\n, \t)
        text = "".join(ch for ch in text if ch == "\n" or ch == "\t" or not unicodedata.category(ch).startswith("C"))

        # Collapse horizontal whitespace (spaces, tabs) into single space
        text = re.sub(r"[ \t]+", " ", text)

        # Collapse 3+ newlines into 2 (preserve paragraph breaks)
        text = re.sub(r"\n{3,}", "\n\n", text)

        return text.strip()

cleaner = TextCleaner()
