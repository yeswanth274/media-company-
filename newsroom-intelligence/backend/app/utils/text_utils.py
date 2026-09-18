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
    "list", "describe", "say", "says", "define", "meaning"
}

# Technical / coding / general computer science keywords that are not investigative archive questions
TECH_KEYWORDS: Set[str] = {
    "dsa", "leetcode", "quicksort", "mergesort", "binary search", "linked list",
    "binary tree", "hashmap", "dynamic programming", "time complexity", "big o",
    "recursion", "pointer", "oop", "polymorphism", "inheritance", "encapsulation",
    "python code", "java code", "c++", "javascript", "react hook", "useeffect",
    "sql query", "database normalization", "docker", "kubernetes", "rest api",
    "html", "css", "machine learning", "deep learning", "neural network", "transformer model",
    "gradient descent", "backpropagation", "sorting algorithm", "breadth first search",
    "depth first search", "graph traversal", "stack queue", "heapsort"
}

def extract_content_terms(text: str) -> Set[str]:
    """
    Extracts content-bearing words (lowercased, without punctuation, excluding stop words).
    """
    if not text:
        return set()
    raw_words = re.findall(r"[a-zA-Z0-9_\'-]+", text.lower())
    return {w for w in raw_words if len(w) >= 2 and w not in STOP_WORDS}

def is_query_relevant(query: str, chunks: List[Any]) -> bool:
    """
    Strictly verifies whether the query is relevant to indexed archive evidence.
    Returns False for technical/coding questions, out-of-domain topics, or queries without evidence.
    """
    if not query or not query.strip() or not chunks:
        return False

    q_lower = query.lower().strip()

    # Check for general tech / coding terms
    for tech_term in TECH_KEYWORDS:
        if tech_term in q_lower:
            # Check if this exact tech term is mentioned in the archive chunks
            in_archive = any(tech_term in (getattr(c, "text", "") or "").lower() for c in chunks)
            if not in_archive:
                return False

    terms = extract_content_terms(query)
    if not terms:
        return False

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

    # If zero key terms match any chunk text, it is completely irrelevant
    if len(matched_terms) == 0:
        return False

    # Relevance conditions:
    # 1. Multiple key content terms (>= 2) match and score >= 0.12
    if len(matched_terms) >= 2 and max_score >= 0.12:
        return True

    # 2. At least one key term matches with high term coverage (>= 50%) and score >= 0.18
    if len(matched_terms) >= 1 and match_ratio >= 0.50 and max_score >= 0.18:
        return True

    # 3. Very high semantic similarity score (>= 0.35)
    if max_score >= 0.35 and len(matched_terms) >= 1:
        return True

    return False
