"""
Search models.

Two ranking strategies are implemented, both operating on the TF-IDF index:

    1) Vectorial Model  -> Cosine similarity between query vector and docs
    2) Extended Boolean -> p-norm aggregation (Salton, Fox & Wu, 1983)

Both return the same shape of result so the API and UI can stay agnostic.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass
from typing import List, Tuple

import numpy as np

from .indexer import Index
from .preprocessing import preprocess_query


# ---------------------------------------------------------------------------
# Result data class
# ---------------------------------------------------------------------------
@dataclass
class SearchResult:
    filename: str
    snippet: str
    score: float

    def to_dict(self) -> dict:
        return {
            "filename": self.filename,
            "snippet": self.snippet,
            "score": round(float(self.score), 6),
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _query_tfidf_vector(index: Index, query_terms: List[str]) -> np.ndarray:
    """
    Build the TF-IDF vector for a query in the same vector space as the
    documents (same vocabulary, same IDF weights).

    Terms in the query that are out-of-vocabulary contribute nothing —
    they are silently ignored, which is the standard behavior.
    """
    V = len(index.vocabulary)
    q = np.zeros(V, dtype=np.float64)
    if V == 0:
        return q

    # Raw term frequencies in the query
    for term in query_terms:
        idx = index.term_to_idx.get(term)
        if idx is not None:
            q[idx] += 1.0

    # Apply the same sub-linear TF + IDF transformation as documents
    with np.errstate(divide="ignore"):
        q = np.where(q > 0, 1.0 + np.log10(np.where(q > 0, q, 1)), 0.0)
    q = q * index.idf
    return q


# ---------------------------------------------------------------------------
# 1) Vectorial Model  -  TF-IDF + Cosine Similarity
# ---------------------------------------------------------------------------
def vectorial_search(
    index: Index, query: str, top_k: int = 20
) -> List[SearchResult]:
    """
    Cosine similarity ranking.

    Formula:
        sim(q, d) = (q · d) / ( ||q||_2 * ||d||_2 )

    where q and d are TF-IDF weighted vectors.

    Documents with a non-positive similarity are filtered out
    (no shared vocabulary with the query).
    """
    if not index.documents:
        return []

    q_terms = preprocess_query(query)
    if not q_terms:
        return []

    q_vec = _query_tfidf_vector(index, q_terms)
    q_norm = float(np.linalg.norm(q_vec))
    if q_norm == 0.0:
        return []

    # Numerator  = q · d  for every doc d  -> single matrix-vector product.
    numerators = q_vec @ index.tfidf                          # shape (N,)
    denominators = q_norm * index.doc_norms                   # shape (N,)
    # Safe division (a doc with zero norm cannot match anything).
    similarities = np.where(denominators > 0, numerators / denominators, 0.0)

    return _topk_results(index, similarities, top_k)


# ---------------------------------------------------------------------------
# 2) Extended Boolean Model  -  p-norm
# ---------------------------------------------------------------------------
# Operators supported in the query string: AND, OR, NOT
# The query is parsed into Reverse Polish Notation (shunting-yard) so we can
# evaluate arbitrary boolean expressions without recursion.
# ---------------------------------------------------------------------------

_PRECEDENCE = {"NOT": 3, "AND": 2, "OR": 1}
_RIGHT_ASSOC = {"NOT"}
_OPERATORS = set(_PRECEDENCE.keys())


def _tokenize_boolean_query(query: str) -> List[str]:
    """Split a boolean query into operator/parenthesis/term tokens."""
    raw = re.findall(r"\(|\)|[A-Za-z0-9_]+", query)
    out: List[str] = []
    for tok in raw:
        upper = tok.upper()
        if upper in _OPERATORS or tok in ("(", ")"):
            out.append(upper if upper in _OPERATORS else tok)
        else:
            out.append(tok)  # term, lowercased later by preprocessing
    return out


def _shunting_yard(tokens: List[str]) -> List[str]:
    """Convert infix boolean expression to postfix (RPN)."""
    output: List[str] = []
    stack: List[str] = []
    for tok in tokens:
        if tok in _OPERATORS:
            while stack and stack[-1] in _OPERATORS and (
                (tok not in _RIGHT_ASSOC and _PRECEDENCE[stack[-1]] >= _PRECEDENCE[tok])
                or (tok in _RIGHT_ASSOC and _PRECEDENCE[stack[-1]] > _PRECEDENCE[tok])
            ):
                output.append(stack.pop())
            stack.append(tok)
        elif tok == "(":
            stack.append(tok)
        elif tok == ")":
            while stack and stack[-1] != "(":
                output.append(stack.pop())
            if stack and stack[-1] == "(":
                stack.pop()
        else:
            output.append(tok)  # term
    while stack:
        output.append(stack.pop())
    return output


def _term_membership(index: Index, term: str) -> np.ndarray:
    """
    Per-document score in [0, 1] for a single query term.

    We use the *normalized* TF-IDF weight as the term's "degree of
    membership" in each document, which is the standard way to feed
    weighted documents into the Extended Boolean model.
    """
    N = len(index.documents)
    pre = preprocess_query(term)
    if not pre:
        return np.zeros(N)
    idx = index.term_to_idx.get(pre[0])
    if idx is None:
        return np.zeros(N)

    weights = index.tfidf[idx, :].copy()
    max_w = float(weights.max()) if weights.size else 0.0
    if max_w <= 0.0:
        return np.zeros(N)
    return weights / max_w  # values in [0, 1]


def _p_norm_or(scores: List[np.ndarray], p: float) -> np.ndarray:
    """
    Extended Boolean OR (Salton et al. 1983):

                 ( w1^p + w2^p + ... + wn^p ) ^ (1/p)
        OR_p =   --------------------------------------
                                  n^(1/p)

    p = 1  -> behaves like a sum (lenient, fuzzy union)
    p ->∞  -> behaves like classical max (strict OR)
    """
    n = len(scores)
    if n == 0:
        return np.zeros(0)
    stacked = np.stack(scores, axis=0)                # (n, N)
    powered = np.power(np.clip(stacked, 0.0, 1.0), p)
    return np.power(powered.sum(axis=0) / n, 1.0 / p)


def _p_norm_and(scores: List[np.ndarray], p: float) -> np.ndarray:
    """
    Extended Boolean AND (Salton et al. 1983):

                       ( (1-w1)^p + (1-w2)^p + ... ) ^ (1/p)
        AND_p = 1  -  ----------------------------------------
                                       n^(1/p)

    p = 1  -> behaves like an average (lenient AND)
    p ->∞  -> behaves like classical min (strict AND)
    """
    n = len(scores)
    if n == 0:
        return np.zeros(0)
    stacked = np.stack(scores, axis=0)
    complement = np.power(1.0 - np.clip(stacked, 0.0, 1.0), p)
    return 1.0 - np.power(complement.sum(axis=0) / n, 1.0 / p)


def _p_norm_not(score: np.ndarray) -> np.ndarray:
    """Fuzzy negation: NOT(w) = 1 - w."""
    return 1.0 - np.clip(score, 0.0, 1.0)


def extended_boolean_search(
    index: Index, query: str, p: float = 2.0, top_k: int = 20
) -> List[SearchResult]:
    """
    Evaluate an Extended Boolean (p-norm) query.

    The query may contain AND, OR, NOT and parentheses, e.g.:
        (information AND retrieval) OR search
        machine AND learning AND NOT supervised
    A bare query like "information retrieval" is treated as
        information OR retrieval
    which is the conventional behavior when no explicit operator is given.
    """
    if not index.documents:
        return []
    if p <= 0:
        p = 1.0  # defensive: p must be positive

    tokens = _tokenize_boolean_query(query)
    if not tokens:
        return []

    # If the query has no explicit operators, default to an OR over all terms.
    if not any(t in _OPERATORS for t in tokens):
        terms = [t for t in tokens if t not in ("(", ")")]
        if not terms:
            return []
        scores = [_term_membership(index, t) for t in terms]
        scores = [s for s in scores if s.size]
        if not scores:
            return []
        agg = _p_norm_or(scores, p) if len(scores) > 1 else scores[0]
        return _topk_results(index, agg, top_k)

    # --- Otherwise evaluate the boolean expression with p-norm operators ---
    rpn = _shunting_yard(tokens)
    stack: List[Tuple[str, np.ndarray]] = []  # ("op"|"term", scores)

    # Group consecutive operands of the same operator so OR/AND aggregate
    # properly across more than two terms (a OR b OR c -> single p-norm OR).
    for tok in rpn:
        if tok == "NOT":
            if not stack:
                continue
            _kind, vec = stack.pop()
            stack.append(("term", _p_norm_not(vec)))
        elif tok in ("AND", "OR"):
            if len(stack) < 2:
                continue
            right_kind, right = stack.pop()
            left_kind, left = stack.pop()

            # Flatten chains of identical operators into n-ary aggregation.
            operands: List[np.ndarray] = []
            if left_kind == tok:
                operands.append(left)
            else:
                operands.append(left)
            operands.append(right)

            if tok == "OR":
                stack.append((tok, _p_norm_or(operands, p)))
            else:
                stack.append((tok, _p_norm_and(operands, p)))
        else:
            stack.append(("term", _term_membership(index, tok)))

    if not stack:
        return []
    final = stack[-1][1]
    return _topk_results(index, final, top_k)


# ---------------------------------------------------------------------------
# Shared top-K + filtering helper
# ---------------------------------------------------------------------------
def _topk_results(
    index: Index, scores: np.ndarray, top_k: int
) -> List[SearchResult]:
    if scores.size == 0:
        return []
    # We only return strictly-positive scores; a 0 means "no match at all"
    # under both ranking schemes.
    order = np.argsort(-scores)
    results: List[SearchResult] = []
    for j in order[: max(top_k, 0)]:
        s = float(scores[j])
        if s <= 0.0:
            break
        doc = index.documents[j]
        results.append(SearchResult(filename=doc.filename, snippet=doc.snippet, score=s))
    return results
