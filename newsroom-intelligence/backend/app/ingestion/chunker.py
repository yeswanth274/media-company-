import re
import json
from typing import List, Dict, Any, Optional
from app.database.models import ChunkCreate
from app.ingestion.extractors import DocumentPage
from app.utils.config import settings
from app.utils.logging import logger

TIMESTAMP_PATTERN = re.compile(r"(?:\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?)")

class SemanticChunker:
    def __init__(self, target_chunk_size: int = settings.CHUNK_SIZE, overlap: int = settings.CHUNK_OVERLAP):
        """
        target_chunk_size: tokens estimate (~4 chars per token).
        overlap: token overlap.
        """
        self.target_chars = target_chunk_size * 4
        self.overlap_chars = overlap * 4

    def _split_into_paragraphs(self, text: str) -> List[str]:
        # Split on double newlines
        paras = re.split(r"\n\s*\n", text)
        return [p.strip() for p in paras if p.strip()]

    def _split_into_sentences(self, text: str) -> List[str]:
        # Split on sentence boundaries (. ! ?)
        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sentences if s.strip()]

    def _extract_timestamps(self, text: str) -> tuple[Optional[str], Optional[str]]:
        matches = TIMESTAMP_PATTERN.findall(text)
        if matches:
            return matches[0], matches[-1]
        return None, None

    def chunk_document(
        self,
        document_id: int,
        pages: List[DocumentPage],
        doc_metadata: Dict[str, Any]
    ) -> List[ChunkCreate]:
        chunks: List[ChunkCreate] = []
        chunk_index = 0

        for page in pages:
            page_text = page.text.strip()
            if not page_text:
                continue

            page_num = page.page_number
            paragraphs = self._split_into_paragraphs(page_text)

            current_chunk_parts: List[str] = []
            current_len = 0

            for para in paragraphs:
                para_len = len(para)

                # If single paragraph is larger than target chunk size, split by sentences
                if para_len > self.target_chars:
                    sentences = self._split_into_sentences(para)
                    for sent in sentences:
                        sent_len = len(sent)
                        if current_len + sent_len > self.target_chars and current_chunk_parts:
                            chunk_text = " ".join(current_chunk_parts).strip()
                            t_start, t_end = self._extract_timestamps(chunk_text)
                            if not t_start and page.timestamp_start:
                                t_start = page.timestamp_start
                            if not t_end and page.timestamp_end:
                                t_end = page.timestamp_end

                            meta = {
                                "title": doc_metadata.get("title", ""),
                                "source_type": doc_metadata.get("source_type", "article"),
                                "publication": doc_metadata.get("publication", ""),
                                "author": doc_metadata.get("author", ""),
                                "publication_date": doc_metadata.get("publication_date", ""),
                                "page_number": page_num,
                                "timestamp_start": t_start,
                                "timestamp_end": t_end
                            }

                            chunks.append(ChunkCreate(
                                document_id=document_id,
                                chunk_index=chunk_index,
                                text=chunk_text,
                                page_number=page_num,
                                timestamp_start=t_start,
                                timestamp_end=t_end,
                                metadata_json=json.dumps(meta)
                            ))
                            chunk_index += 1

                            # Retain overlap sentences
                            overlap_parts = []
                            acc_len = 0
                            for prev_sent in reversed(current_chunk_parts):
                                if acc_len + len(prev_sent) <= self.overlap_chars:
                                    overlap_parts.insert(0, prev_sent)
                                    acc_len += len(prev_sent)
                                else:
                                    break
                            current_chunk_parts = overlap_parts + [sent]
                            current_len = sum(len(p) for p in current_chunk_parts)
                        else:
                            current_chunk_parts.append(sent)
                            current_len += sent_len
                else:
                    if current_len + para_len > self.target_chars and current_chunk_parts:
                        chunk_text = "\n\n".join(current_chunk_parts).strip()
                        t_start, t_end = self._extract_timestamps(chunk_text)
                        if not t_start and page.timestamp_start:
                            t_start = page.timestamp_start
                        if not t_end and page.timestamp_end:
                            t_end = page.timestamp_end

                        meta = {
                            "title": doc_metadata.get("title", ""),
                            "source_type": doc_metadata.get("source_type", "article"),
                            "publication": doc_metadata.get("publication", ""),
                            "author": doc_metadata.get("author", ""),
                            "publication_date": doc_metadata.get("publication_date", ""),
                            "page_number": page_num,
                            "timestamp_start": t_start,
                            "timestamp_end": t_end
                        }

                        chunks.append(ChunkCreate(
                            document_id=document_id,
                            chunk_index=chunk_index,
                            text=chunk_text,
                            page_number=page_num,
                            timestamp_start=t_start,
                            timestamp_end=t_end,
                            metadata_json=json.dumps(meta)
                        ))
                        chunk_index += 1

                        # Retain overlap from end of previous paragraph
                        last_part = current_chunk_parts[-1] if current_chunk_parts else ""
                        if len(last_part) <= self.overlap_chars:
                            current_chunk_parts = [last_part, para]
                        else:
                            current_chunk_parts = [para]
                        current_len = sum(len(p) for p in current_chunk_parts)
                    else:
                        current_chunk_parts.append(para)
                        current_len += para_len

            # Residual chunk
            if current_chunk_parts:
                chunk_text = "\n\n".join(current_chunk_parts).strip()
                if chunk_text:
                    t_start, t_end = self._extract_timestamps(chunk_text)
                    if not t_start and page.timestamp_start:
                        t_start = page.timestamp_start
                    if not t_end and page.timestamp_end:
                        t_end = page.timestamp_end

                    meta = {
                        "title": doc_metadata.get("title", ""),
                        "source_type": doc_metadata.get("source_type", "article"),
                        "publication": doc_metadata.get("publication", ""),
                        "author": doc_metadata.get("author", ""),
                        "publication_date": doc_metadata.get("publication_date", ""),
                        "page_number": page_num,
                        "timestamp_start": t_start,
                        "timestamp_end": t_end
                    }

                    chunks.append(ChunkCreate(
                        document_id=document_id,
                        chunk_index=chunk_index,
                        text=chunk_text,
                        page_number=page_num,
                        timestamp_start=t_start,
                        timestamp_end=t_end,
                        metadata_json=json.dumps(meta)
                    ))
                    chunk_index += 1

        return chunks

chunker = SemanticChunker()
