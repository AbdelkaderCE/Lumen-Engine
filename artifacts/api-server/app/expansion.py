"""
Query-term prefix expansion.

Stemming alone cannot match abbreviations or partial prefixes
(e.g. Porter stems "cosine" -> "cosin" and "cos" -> "co", so the two never
collide). To bridge that gap we add a textbook query-expansion step:

    For each user query term t:
      1. If the stemmed form of t is already in the vocabulary,
         use it as-is (the most precise match).
      2. Otherwise, expand t to *every* vocabulary term that starts
         with the same prefix as t (or its stem, whichever yields
         matches).

This is the "wildcard / prefix query" technique described in
Manning, Raghavan & Schütze - Introduction to Information Retrieval, ch. 3.
"""

from __future__ import annotations

from typing import List

from .indexer import Index
from .preprocessing import _STEMMER, tokenize


# Soft cap to keep scoring focused.
MAX_EXPANSIONS_PER_TERM = 10


def _vocab_starting_with(index: Index, prefix: str) -> List[str]:
    """All vocabulary terms beginning with `prefix`."""
    if not prefix:
        return []
    return [t for t in index.vocabulary if t.startswith(prefix)]


def expand_term(index: Index, raw_token: str, use_prefix_expansion: bool = True) -> List[str]:
    """
    Expand a single raw user token into one or more vocabulary terms.

    Strict Rules:
        1. If expansion is OFF, only allow exact stem hit.
        2. If expansion is ON, only expand if token length >= 3.
        3. Prefix matches are capped at 10.
    """
    if not raw_token:
        return []

    pieces = tokenize(raw_token)
    if not pieces:
        return []
    raw = pieces[0]
    stem = _STEMMER.stem(raw)

    # 1. Base exact match
    exact_hit = [stem] if stem in index.term_to_idx else []

    # CASE 1: Expansion is OFF
    if not use_prefix_expansion:
        return exact_hit

    # CASE 2: Expansion is ON
    if len(raw) < 3:
        return exact_hit

    matches = list(exact_hit)
    
    # Prefix match using the raw token (e.g. "coo" -> "cool", "cooper")
    raw_matches = _vocab_starting_with(index, raw)
    for m in raw_matches:
        if m not in matches:
            matches.append(m)

    # Fallback to stem prefix match
    if len(matches) < 2 and stem and stem != raw:
        stem_matches = _vocab_starting_with(index, stem)
        for m in stem_matches:
            if m not in matches:
                matches.append(m)

    return matches[:MAX_EXPANSIONS_PER_TERM]


def expand_query(index: Index, raw_tokens: List[str], use_prefix_expansion: bool = True) -> List[List[str]]:
    """Expand each raw query token."""
    return [expand_term(index, t, use_prefix_expansion=use_prefix_expansion) for t in raw_tokens]
