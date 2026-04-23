"""
Search models.

Two ranking strategies are implemented, both operating on the TF-IDF index:

    1) Vectorial Model  -> Cosine similarity between query vector and docs
    2) Extended Boolean -> p-norm aggregation (Salton, Fox & Wu, 1983)

Both return the same shape of result so the API and UI can stay agnostic.

Query handling
--------------
Every query term passes through two layers before being scored:
    a) Porter stemming + stopword removal  (preprocessing.py)
    b) Prefix expansion                    (expansion.py)
The expansion turns "cos" into the vocabulary set {cosin, …} so the
ranking models can find documents that share only a prefix with the query.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

import numpy as np

from .expansion import expand_term, expand_query
from .indexer import Index
from .preprocessing import tokenize


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
def _query_tfidf_vector(index: Index, vocab_terms: List[str]) -> np.ndarray:
    """
    Build the TF-IDF vector for a query in the same vector space as the
    documents (same vocabulary, same IDF weights).

    `vocab_terms` is the FLAT list of vocabulary terms after preprocessing
    AND prefix expansion: each occurrence contributes 1 to the raw TF.
    Out-of-vocabulary entries are silently ignored.
    """
    V = len(index.vocabulary)
    q = np.zeros(V, dtype=np.float64)
    if V == 0:
        return q

    # Raw term frequencies in the (expanded) query
    for term in vocab_terms:
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
@dataclass
class VectorialOutcome:
    results: List[SearchResult] = field(default_factory=list)
    expansions: Dict[str, List[str]] = field(default_factory=dict)


def vectorial_search(
    index: Index, query: str, top_k: int = 20
) -> VectorialOutcome:
    """
    Cosine similarity ranking with prefix expansion.

    Formula:
        sim(q, d) = (q · d) / ( ||q||_2 * ||d||_2 )

    where q and d are TF-IDF weighted vectors. The query vector q is
    built from the *expanded* set of vocabulary terms, so a query token
    like "cos" contributes mass to every vocabulary term beginning with
    "cos" (such as the stem "cosin" produced from "cosine").
    """
    if not index.documents:
        return VectorialOutcome()

    raw_tokens = tokenize(query)
    if not raw_tokens:
        return VectorialOutcome()

    # Expand each raw token; keep a per-token map so we can return it for
    # transparency (the UI shows what was actually searched).
    per_token_expansions = expand_query(index, raw_tokens)
    expansion_map: Dict[str, List[str]] = {
        raw: exp for raw, exp in zip(raw_tokens, per_token_expansions) if exp
    }

    # Flatten -> list of vocabulary terms used to build the query vector.
    flat_terms = [t for sub in per_token_expansions for t in sub]
    if not flat_terms:
        return VectorialOutcome(expansions=expansion_map)

    q_vec = _query_tfidf_vector(index, flat_terms)
    q_norm = float(np.linalg.norm(q_vec))
    if q_norm == 0.0:
        return VectorialOutcome(expansions=expansion_map)

    # Numerator  = q · d  for every doc d  -> single matrix-vector product.
    numerators = q_vec @ index.tfidf                          # shape (N,)
    denominators = q_norm * index.doc_norms                   # shape (N,)
    similarities = np.where(denominators > 0, numerators / denominators, 0.0)

    return VectorialOutcome(
        results=_topk_results(index, similarities, top_k),
        expansions=expansion_map,
    )


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


def _single_term_membership(index: Index, vocab_term: str) -> np.ndarray:
    """Per-document membership in [0, 1] for a single vocabulary term,
    using the normalized TF-IDF weight as fuzzy degree of membership."""
    N = len(index.documents)
    idx = index.term_to_idx.get(vocab_term)
    if idx is None:
        return np.zeros(N)
    weights = index.tfidf[idx, :].copy()
    max_w = float(weights.max()) if weights.size else 0.0
    if max_w <= 0.0:
        return np.zeros(N)
    return weights / max_w


def _term_membership(
    index: Index, raw_term: str, expansions_log: Dict[str, List[str]]
) -> np.ndarray:
    """
    Per-document score in [0, 1] for a single user query term, after
    prefix expansion.

    When a token expands to several vocabulary terms (e.g. "cos" -> {cosin,
    code, …}) we take the *element-wise maximum* of their memberships.
    Max is the classical Boolean OR and the natural choice for combining
    alternative spellings of the same intent — a document is at least as
    relevant as its best matching expansion.
    """
    N = len(index.documents)
    expanded = expand_term(index, raw_term)
    if expanded:
        expansions_log.setdefault(raw_term, expanded)
    if not expanded:
        return np.zeros(N)
    memberships = [_single_term_membership(index, t) for t in expanded]
    stacked = np.stack(memberships, axis=0)        # shape (k, N)
    return stacked.max(axis=0)


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


@dataclass
class BooleanOutcome:
    results: List[SearchResult] = field(default_factory=list)
    expansions: Dict[str, List[str]] = field(default_factory=dict)


def extended_boolean_search(
    index: Index, query: str, p: float = 2.0, top_k: int = 20
) -> BooleanOutcome:
    """
    Evaluate an Extended Boolean (p-norm) query, with prefix expansion
    applied to every operand.

    The query may contain AND, OR, NOT and parentheses, e.g.:
        (information AND retrieval) OR search
        machine AND learning AND NOT supervised
    A bare query like "information retrieval" is treated as
        information OR retrieval
    which is the conventional behavior when no explicit operator is given.
    """
    if not index.documents:
        return BooleanOutcome()
    if p <= 0:
        p = 1.0  # defensive: p must be positive

    tokens = _tokenize_boolean_query(query)
    if not tokens:
        return BooleanOutcome()

    expansions_log: Dict[str, List[str]] = {}

    # If the query has no explicit operators, default to an OR over all terms.
    if not any(t in _OPERATORS for t in tokens):
        terms = [t for t in tokens if t not in ("(", ")")]
        if not terms:
            return BooleanOutcome()
        scores = [_term_membership(index, t, expansions_log) for t in terms]
        scores = [s for s in scores if s.size]
        if not scores:
            return BooleanOutcome(expansions=expansions_log)
        agg = _p_norm_or(scores, p) if len(scores) > 1 else scores[0]
        return BooleanOutcome(
            results=_topk_results(index, agg, top_k),
            expansions=expansions_log,
        )

    # --- Otherwise evaluate the boolean expression with p-norm operators ---
    rpn = _shunting_yard(tokens)
    stack: List[Tuple[str, np.ndarray]] = []  # ("op"|"term", scores)

    for tok in rpn:
        if tok == "NOT":
            if not stack:
                continue
            _kind, vec = stack.pop()
            stack.append(("term", _p_norm_not(vec)))
        elif tok in ("AND", "OR"):
            if len(stack) < 2:
                continue
            _right_kind, right = stack.pop()
            _left_kind, left = stack.pop()
            operands = [left, right]
            if tok == "OR":
                stack.append((tok, _p_norm_or(operands, p)))
            else:
                stack.append((tok, _p_norm_and(operands, p)))
        else:
            stack.append(("term", _term_membership(index, tok, expansions_log)))

    if not stack:
        return BooleanOutcome(expansions=expansions_log)
    final = stack[-1][1]
    return BooleanOutcome(
        results=_topk_results(index, final, top_k),
        expansions=expansions_log,
    )


# ---------------------------------------------------------------------------
# Shared top-K + filtering helper
# ---------------------------------------------------------------------------
def _topk_results(
    index: Index, scores: np.ndarray, top_k: int
) -> List[SearchResult]:
    if scores.size == 0:
        return []
    order = np.argsort(-scores)
    results: List[SearchResult] = []
    for j in order[: max(top_k, 0)]:
        s = float(scores[j])
        if s <= 0.0:
            break
        doc = index.documents[j]
        results.append(SearchResult(filename=doc.filename, snippet=doc.snippet, score=s))
    return results
