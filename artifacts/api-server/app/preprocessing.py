"""
Text preprocessing pipeline for the Information Retrieval engine.

Pipeline stages (standard IR practice):
    1. Lowercasing       -> normalize case
    2. Tokenization      -> split text into word tokens (alphabetic only)
    3. Stop-word removal -> remove very frequent function words (the, a, of...)
    4. Stemming          -> reduce inflected forms to a common root (Porter stemmer)

These are the canonical preprocessing steps described in any IR course
(e.g. Manning, Raghavan, Schütze - Introduction to Information Retrieval, ch. 2).
"""

from __future__ import annotations

import os
import re
from typing import List

import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

# ---------------------------------------------------------------------------
# NLTK resource bootstrap
# ---------------------------------------------------------------------------
# We download the required NLTK resources lazily into a local folder so the
# engine works in a sandboxed environment without an internet connection at
# request time.
_NLTK_DIR = os.path.join(os.path.dirname(__file__), "..", "nltk_data")
_NLTK_DIR = os.path.abspath(_NLTK_DIR)
os.makedirs(_NLTK_DIR, exist_ok=True)
if _NLTK_DIR not in nltk.data.path:
    nltk.data.path.insert(0, _NLTK_DIR)


def _ensure_nltk_resources() -> None:
    """Download stopword corpus once (idempotent)."""
    try:
        stopwords.words("english")
    except LookupError:
        nltk.download("stopwords", download_dir=_NLTK_DIR, quiet=True)


_ensure_nltk_resources()

# ---------------------------------------------------------------------------
# Singletons
# ---------------------------------------------------------------------------
_STEMMER = PorterStemmer()
_STOPWORDS = set(stopwords.words("english"))

# Simple alphabetic tokenizer. We use a regex rather than nltk.word_tokenize
# to avoid having to download the punkt model at runtime.
_TOKEN_RE = re.compile(r"[A-Za-z]+")


def tokenize(text: str) -> List[str]:
    """Lowercase + split text into alphabetic tokens."""
    return _TOKEN_RE.findall(text.lower())


def preprocess(text: str) -> List[str]:
    """
    Apply the full preprocessing pipeline to a string.

    Returns a list of stemmed tokens with stop-words removed.
    These tokens are the "terms" used by the indexer.
    """
    tokens = tokenize(text)
    return [_STEMMER.stem(t) for t in tokens if t not in _STOPWORDS and len(t) > 1]


def preprocess_query(query: str) -> List[str]:
    """Same pipeline as documents — preprocessing must be symmetric."""
    return preprocess(query)
