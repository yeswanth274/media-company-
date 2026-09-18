import re
from typing import Set, List, Any

STOP_WORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
    "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
    "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
    "during", "each", "few", "for", "from", "further", "had", "hadn't", "has",
    "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's",
    "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it",
    "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my",
    "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other",
    "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't",
    "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such",
    "than", "that", "that's", "the", "their", "theirs", "them", "themselves",
    "then", "there", "there's", "these", "they", "they'd", "they'll", "they're",
    "they've", "this", "those", "through", "to", "too", "under", "until", "up",
    "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "whatever", "when", "when's", "where", "where's",
    "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't",
    "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your",
    "yours", "yourself", "yourselves", "tell", "show", "give", "explain", "detail",
    "details", "information", "info", "please", "said", "happened", "know", "find",
    "list", "describe", "say", "says"
}

def extract_content_terms(text: str) -> Set[str]:
    """
    Extracts content-bearing words (lowercased, without punctuation, excluding stop words).
    """
    if not text:
        return set()
    raw_words = re.findall(r"[a-zA-Z0-9_\'-]+", text.lower())
    return {w for w in raw_words if len(w) >= 2 and w not in STOP_WORDS}

def is_query_relevant(query: str, chunks: List[Any], min_semantic_score: float = 0.22) -> bool:
    """
    Determines if retrieved chunks possess sufficient relevance to answer the query.
    Combines dense semantic similarity with exact content keyword matching.
    """
    if not query or not query.strip() or not chunks:
        return False

    terms = extract_content_terms(query)
    scores = [getattr(c, "score", 0.0) or 0.0 for c in chunks]
    max_score = max(scores) if scores else 0.0

    # Build corpus tokens of retrieved chunks
    chunk_texts = []
    for c in chunks:
        title = getattr(c, "title", "") or getattr(c, "document_title", "") or ""
        author = getattr(c, "author", "") or ""
        publication = getattr(c, "publication", "") or ""
        text = getattr(c, "text", "") or ""
        chunk_texts.append(f"{title} {author} {publication} {text}")

    combined_corpus = " ".join(chunk_texts).lower()
    corpus_tokens = set(re.findall(r"[a-zA-Z0-9_\'-]+", combined_corpus))

    matched_terms = terms.intersection(corpus_tokens) if terms else set()
    match_ratio = (len(matched_terms) / len(terms)) if terms else 0.0

    # Relevance conditions:
    # 1. Multiple key content terms (>= 2) match and score >= 0.10
    if len(matched_terms) >= 2 and max_score >= 0.10:
        return True

    # 2. At least one key term matches with high term coverage (>= 50%) and score >= 0.14
    if len(matched_terms) >= 1 and match_ratio >= 0.50 and max_score >= 0.14:
        return True

    # 3. High semantic similarity score (>= 0.28)
    if max_score >= 0.28:
        return True

    # Otherwise, the query is deemed unrelated or insufficiently backed
    return False
