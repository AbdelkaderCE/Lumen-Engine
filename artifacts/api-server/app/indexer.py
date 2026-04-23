"""
Inverted index + TF-IDF weighting matrix.

This module is the mathematical core of the engine. It builds:

    * A vocabulary (sorted list of unique terms)
    * A term-document frequency matrix              (raw counts)
    * A TF-IDF weight matrix                        (used by both models)
    * Pre-computed document vector norms            (used for cosine sim)

Mathematical formulas
---------------------
Let N      = number of documents in the collection
    df_t   = number of documents containing term t
    tf_t,d = number of occurrences of term t in document d

  TF (sub-linear / log-normalized):
        tf_w = 1 + log10(tf_t,d)        if tf_t,d > 0
             = 0                         otherwise
        (Damps the effect of very frequent terms inside a single document.)

  IDF (smoothed, standard form):
        idf_t = log10( N / df_t )
        (High when a term is rare in the collection -> more discriminative.)

  TF-IDF weight:
        w_t,d = tf_w * idf_t

These are the textbook formulas from Salton & Buckley (1988) and used in
basically every introductory IR class.
"""

from __future__ import annotations

import math
import os
from dataclasses import dataclass, field
from typing import Dict, List

import numpy as np

from .loader import RawDocument, load_documents
from .preprocessing import preprocess


@dataclass
class IndexedDocument:
    """A document after preprocessing, ready to be vectorized."""
    filename: str
    snippet: str           # short preview shown in the UI
    text: str              # full raw text (kept for snippet generation)
    tokens: List[str]      # preprocessed terms


@dataclass
class Index:
    """Holds all the data structures needed to answer queries."""
    documents: List[IndexedDocument] = field(default_factory=list)
    vocabulary: List[str] = field(default_factory=list)
    term_to_idx: Dict[str, int] = field(default_factory=dict)

    # tfidf[i, j] = TF-IDF weight of term i in document j
    # Stored term-major because queries also project into the same space.
    tfidf: np.ndarray = field(default_factory=lambda: np.zeros((0, 0)))

    # idf[i] = inverse document frequency of term i
    idf: np.ndarray = field(default_factory=lambda: np.zeros(0))

    # doc_norms[j] = || tfidf[:, j] ||_2  (precomputed for cosine similarity)
    doc_norms: np.ndarray = field(default_factory=lambda: np.zeros(0))


def _make_snippet(text: str, length: int = 220) -> str:
    """Single-line preview used by the frontend cards."""
    cleaned = " ".join(text.split())
    return cleaned[:length] + ("…" if len(cleaned) > length else "")


def build_index(data_dir: str) -> Index:
    """
    Read the corpus from `data_dir` and build the full TF-IDF index.

    The index is the only data structure the search models need.
    """
    raw_docs: List[RawDocument] = load_documents(data_dir)

    # --- Preprocess every document ------------------------------------------------
    indexed: List[IndexedDocument] = []
    for raw in raw_docs:
        tokens = preprocess(raw.text)
        if not tokens:
            # Skip empty / non-textual documents (e.g. a PDF with only images).
            continue
        indexed.append(
            IndexedDocument(
                filename=raw.filename,
                snippet=_make_snippet(raw.text),
                text=raw.text,
                tokens=tokens,
            )
        )

    if not indexed:
        return Index()

    # --- Build the vocabulary ------------------------------------------------------
    vocab_set = set()
    for d in indexed:
        vocab_set.update(d.tokens)
    vocabulary = sorted(vocab_set)
    term_to_idx = {t: i for i, t in enumerate(vocabulary)}

    V = len(vocabulary)
    N = len(indexed)

    # --- Raw term-frequency matrix ------------------------------------------------
    # tf[i, j] = number of occurrences of term i in document j
    tf = np.zeros((V, N), dtype=np.float64)
    for j, doc in enumerate(indexed):
        for term in doc.tokens:
            tf[term_to_idx[term], j] += 1.0

    # --- Document frequency and IDF -----------------------------------------------
    # df[i] = number of documents containing term i  (binary presence)
    df = (tf > 0).sum(axis=1).astype(np.float64)
    # Avoid divide-by-zero (df is always >= 1 here, but keep it defensive).
    idf = np.log10(N / np.where(df == 0, 1, df))

    # --- Sub-linear (logarithmic) TF normalization --------------------------------
    # tf_log[i, j] = 1 + log10(tf[i, j])  if tf > 0 else 0
    with np.errstate(divide="ignore"):
        tf_log = np.where(tf > 0, 1.0 + np.log10(np.where(tf > 0, tf, 1)), 0.0)

    # --- Final TF-IDF weight matrix -----------------------------------------------
    # Broadcast IDF (one value per term) across all documents.
    tfidf = tf_log * idf[:, np.newaxis]

    # --- Precompute per-document L2 norms (used by cosine similarity) -------------
    doc_norms = np.linalg.norm(tfidf, axis=0)

    return Index(
        documents=indexed,
        vocabulary=vocabulary,
        term_to_idx=term_to_idx,
        tfidf=tfidf,
        idf=idf,
        doc_norms=doc_norms,
    )


def index_stats(index: Index) -> dict:
    """Lightweight statistics surfaced in the /api/status endpoint."""
    return {
        "documents": len(index.documents),
        "vocabulary": len(index.vocabulary),
        "files": [d.filename for d in index.documents],
    }


# Convenience: default data directory packaged with the artifact.
DEFAULT_DATA_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "data")
)
