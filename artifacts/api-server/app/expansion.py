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

Returning the expanded set as a plain list keeps the rest of the engine
oblivious to expansion: both the Vectorial and the Extended Boolean models
just receive "more terms".
"""

from __future__ import annotations

from typing import List

from .indexer import Index
from .preprocessing import _STEMMER, tokenize


# Soft cap so an over-eager 1-letter prefix (e.g. "a") doesn't pull the
# entire vocabulary into the query and dilute scoring.
MAX_EXPANSIONS_PER_TERM = 25


def _vocab_starting_with(index: Index, prefix: str) -> List[str]:
    """All vocabulary terms beginning with `prefix`. Linear scan is fine
    for the corpus sizes this engine targets; for very large indexes a
    trie or sorted-vocab binary search would be the obvious upgrade."""
    if not prefix:
        return []
    return [t for t in index.vocabulary if t.startswith(prefix)]


def expand_term(index: Index, raw_token: str, do_expand: bool = True) -> List[str]:
    """
    Expand a single raw user token into one or more vocabulary terms.

    Strategy:
        - Lowercase and stem the token (same pipeline as documents).
        - If the stem is already in the vocabulary, return just [stem].
        - Otherwise try the *raw* lowered token as a prefix first
          (stricter, because "cos" matches "cosin" but the stem "co"
          would over-expand).
        - Fall back to the stem as a prefix if the raw prefix yielded
          nothing.
        - Cap the number of expansions to keep scoring focused.
    """
    if not raw_token:
        return []

    # Use the same tokenizer the indexer uses so we strip punctuation, etc.
    pieces = tokenize(raw_token)
    if not pieces:
        return []
    raw = pieces[0]
    stem = _STEMMER.stem(raw)

    # 1. If expansion is OFF, we ONLY allow the exact stem hit.
    if not do_expand:
        if stem in index.term_to_idx:
            return [stem]
        return []

    # 2. If expansion is ON, we perform a broad prefix search.
    # We collect the exact stem hit AND any other words starting with this prefix.
    matches = []
    if stem in index.term_to_idx:
        matches.append(stem)

    # Prefix match using the raw token (more specific)
    raw_matches = _vocab_starting_with(index, raw)
    for m in raw_matches:
        if m not in matches:
            matches.append(m)

    # Fallback to stem prefix match if we still have very few results
    if len(matches) < 2 and stem and stem != raw:
        stem_matches = _vocab_starting_with(index, stem)
        for m in stem_matches:
            if m not in matches:
                matches.append(m)

    return matches[:MAX_EXPANSIONS_PER_TERM]


def expand_query(index: Index, raw_tokens: List[str], do_expand: bool = True) -> List[List[str]]:
    """Expand each raw query token. Returns one expansion list per token,
    preserving order so callers know which expansions came from which
    original term (useful for explainability in the API response)."""
    return [expand_term(index, t, do_expand=do_expand) for t in raw_tokens]
