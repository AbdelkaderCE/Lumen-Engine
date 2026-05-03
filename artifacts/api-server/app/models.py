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
from typing import Dict, List, Tuple, Optional

import numpy as np

from .expansion import expand_term, expand_query
from .indexer import Index
from .preprocessing import tokenize, _STEMMER


# ---------------------------------------------------------------------------
# Result data class
# ---------------------------------------------------------------------------
@dataclass
class SearchResult:
    filename: str
    snippet: str
    score: float
    debug: Optional[dict] = None

    def to_dict(self) -> dict:
        return {
            "filename": self.filename,
            "snippet": self.snippet,
            "score": round(float(self.score), 6),
            "debug": self.debug
        }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _query_tfidf_vector(index: Index, weighted_terms: List[Tuple[str, float]]) -> np.ndarray:
    """
    Build the TF-IDF vector for a query.
    `weighted_terms` is a list of (vocabulary_term, importance_weight).
    The importance_weight (e.g. 1.0 for exact, 0.5 for expansion) is applied
    to the raw term frequency.
    """
    V = len(index.vocabulary)
    q = np.zeros(V, dtype=np.float64)
    if V == 0:
        return q

    # Weighted term frequencies
    for term, weight in weighted_terms:
        idx = index.term_to_idx.get(term)
        if idx is not None:
            q[idx] += weight

    # Apply sub-linear TF + IDF transformation
    with np.errstate(divide="ignore"):
        q = np.where(q > 0, 1.0 + np.log10(np.where(q > 0, q, 1)), 0.0)
    q = q * index.idf
    return q


def _topk_results(index: Index, similarities: np.ndarray, top_k: int) -> List[SearchResult]:
    """Sort documents by similarity and return top-k."""
    # Find indices of top scores
    indices = np.argsort(-similarities)[:top_k]
    
    results = []
    for idx in indices:
        if similarities[idx] <= 0:
            continue
            
        doc = index.documents[idx]
        results.append(SearchResult(
            filename=doc.filename,
            snippet=doc.snippet,
            score=float(similarities[idx])
        ))
    return results


# ---------------------------------------------------------------------------
# 1) Vectorial Model  -  TF-IDF + Cosine Similarity
# ---------------------------------------------------------------------------
@dataclass
class VectorialOutcome:
    results: List[SearchResult] = field(default_factory=list)
    expansions: Dict[str, List[str]] = field(default_factory=dict)
    viz_data: Optional[dict] = None
    debug: Optional[dict] = None


def vectorial_search(
    index: Index, 
    query: str, 
    similarity: str = "cosine",
    top_k: int = 20, 
    use_prefix_expansion: bool = True
) -> VectorialOutcome:
    """
    Ranking with prefix expansion using various similarity measures.
    Includes 3D visualization data based on the top 3 terms.
    """
    if not index.documents:
        return VectorialOutcome()

    raw_tokens = tokenize(query)
    if not raw_tokens:
        return VectorialOutcome()

    # Expand each raw token
    per_token_expansions = expand_query(index, raw_tokens, use_prefix_expansion=use_prefix_expansion)
    
    # We only show a term in the "expanded" badge if it was actually expanded 
    # to something different than the raw user input (case-insensitive).
    expansion_map: Dict[str, List[str]] = {}
    for raw, exp in zip(raw_tokens, per_token_expansions):
        if not exp: continue
        # Logic: if we have more than one expansion, OR the single expansion is not the raw token
        if len(exp) > 1 or (len(exp) == 1 and exp[0].lower() != raw.lower()):
            expansion_map[raw] = exp

    # Build weighted term list for the vector
    weighted_terms: List[Tuple[str, float]] = []
    for raw, expanded_list in zip(raw_tokens, per_token_expansions):
        if not expanded_list: continue
        raw_stem = _STEMMER.stem(raw.lower())
        for term in expanded_list:
            # Exact stem match gets full weight, prefixes get half
            weight = 1.0 if term == raw_stem else 0.5
            weighted_terms.append((term, weight))

    # CRITICAL: If no terms matched the vocabulary, return zero results
    # instead of letting numpy sort zeros (which would return the first docs in the index).
    if not weighted_terms:
        return VectorialOutcome(
            results=[], 
            expansions=expansion_map,
            viz_data=None
        )

    q_vec = _query_tfidf_vector(index, weighted_terms)
    
    # 1. Similarity calculation
    if similarity == "cosine":
        q_norm = float(np.linalg.norm(q_vec))
        if q_norm == 0.0:
            similarities = np.zeros(len(index.documents))
        else:
            numerators = q_vec @ index.tfidf
            denominators = q_norm * index.doc_norms
            similarities = np.where(denominators > 0, numerators / denominators, 0.0)
    elif similarity == "scalar":
        similarities = q_vec @ index.tfidf
    elif similarity == "euclidean":
        dist = np.linalg.norm(index.tfidf - q_vec[:, np.newaxis], axis=0)
        similarities = 1.0 / (1.0 + dist)
    elif similarity == "jaccard":
        q_col = q_vec[:, np.newaxis]
        intersection = np.minimum(q_col, index.tfidf).sum(axis=0)
        union = np.maximum(q_col, index.tfidf).sum(axis=0)
        similarities = np.where(union > 0, intersection / union, 0.0)
    elif similarity == "dice":
        q_col = q_vec[:, np.newaxis]
        intersection = np.minimum(q_col, index.tfidf).sum(axis=0)
        total_sum = q_vec.sum() + index.tfidf.sum(axis=0)
        similarities = np.where(total_sum > 0, (2.0 * intersection) / total_sum, 0.0)
    else:
        q_norm = float(np.linalg.norm(q_vec))
        similarities = np.zeros(len(index.documents))
        if q_norm > 0:
            numerators = q_vec @ index.tfidf
            denominators = q_norm * index.doc_norms
            similarities = np.where(denominators > 0, numerators / denominators, 0.0)

    # Filter out documents with zero similarity
    if np.all(similarities == 0):
        return VectorialOutcome(results=[], expansions=expansion_map, viz_data=None)

    results = []
    indices = np.argsort(-similarities)[:top_k]
    for idx in indices:
        if similarities[idx] <= 0:
            continue
            
        # Per-document debug: find which query terms contributed most
        doc_tfidf = index.tfidf[:, idx]
        contributions = {}
        for term, weight in weighted_terms:
            t_idx = index.term_to_idx.get(term)
            if t_idx is not None:
                contrib = float(q_vec[t_idx] * doc_tfidf[t_idx])
                if contrib > 0:
                    contributions[term] = round(contrib, 4)

        doc = index.documents[idx]
        results.append(SearchResult(
            filename=doc.filename,
            snippet=doc.snippet,
            score=float(similarities[idx]),
            debug={"contributions": contributions}
        ))

    # 2. 3D Visualization Data Generation
    # We want axes that represent the "topic space" of the results.
    # We'll pick the 3 terms that have the highest total TF-IDF weight across the top documents.
    target_dims = []
    
    if results:
        doc_filenames = {r.filename for r in results}
        doc_indices = [i for i, d in enumerate(index.documents) if d.filename in doc_filenames]
        
        # Calculate aggregate weight for every term in these documents
        if doc_indices:
            sum_weights = index.tfidf[:, doc_indices].sum(axis=1)
            # Only consider terms that are ALSO in the query or are very significant
            # Actually, let's just take the top 3 globally significant terms for these results
            sorted_dims = np.argsort(-sum_weights)
            
            # CRITICAL: Prioritize ALL query terms for the 3 axes
            # This ensures the yellow query line is a multidimensional diagonal
            query_dims = np.where(q_vec > 0)[0]
            if len(query_dims) > 0:
                # Sort query terms by their weight in the query
                sorted_q_dims = query_dims[np.argsort(-q_vec[query_dims])]
                for qd in sorted_q_dims:
                    target_dims.append(int(qd))
                    if len(target_dims) >= 3: break
            
            # Fill remaining axes (if any) with the most frequent terms in results
            for d in sorted_dims:
                if len(target_dims) >= 3: break
                d_idx = int(d)
                if d_idx not in target_dims:
                    target_dims.append(d_idx)

    # Fallback: if we have fewer than 3 terms, fill the remaining axes
    # with the most "important" terms in the whole collection (highest IDF)
    if len(target_dims) < 3:
        # Get indices of all terms sorted by IDF descending
        significant_dims = np.argsort(-index.idf)
        for d in significant_dims:
            d_idx = int(d)
            if d_idx not in target_dims:
                target_dims.append(d_idx)
            if len(target_dims) >= 3: break

    viz_data = None
    if len(target_dims) == 3:
        axes_labels = [index.vocabulary[i] for i in target_dims]
        q_point = [float(q_vec[i]) for i in target_dims]
        
        doc_points = []
        # Find indices again for consistent mapping
        doc_filenames_list = [r.filename for r in results]
        res_doc_indices = []
        for fname in doc_filenames_list:
            for i, d in enumerate(index.documents):
                if d.filename == fname:
                    res_doc_indices.append(i)
                    break
        
        # For CLARITY: only plot the top 5 results in the 3D space
        # Too many arrows make the graph unreadable.
        for idx in res_doc_indices[:5]:
            doc = index.documents[idx]
            pos = [float(index.tfidf[dim_idx, idx]) for dim_idx in target_dims]
            doc_points.append({
                "filename": doc.filename,
                "pos": pos,
                "score": float(similarities[idx])
            })
            
        viz_data = {
            "query_string": query,
            "axes": axes_labels,
            "query": q_point,
            "documents": doc_points
        }

    # Calculation Debug Info
    # Prepare detailed vectorization steps for the "Query Insight"
    vectorization_steps = []
    for term, weight in weighted_terms:
        idx = index.term_to_idx.get(term)
        if idx is not None:
            idf = float(index.idf[idx])
            tf = float(weight) # simplified for query
            final = float(q_vec[idx])
            vectorization_steps.append({
                "term": term,
                "tf": round(tf, 2),
                "idf": round(idf, 2),
                "final_weight": round(final, 4)
            })

    debug_info = {
        "formula": f"{similarity} similarity",
        "query_vectorization": vectorization_steps,
        "query_vector_non_zero": {index.vocabulary[i]: float(q_vec[i]) for i in query_dims},
    }

    print(f"DEBUG MODELS: vectorial_search returning debug={'YES' if debug_info else 'NO'}")
    return VectorialOutcome(
        results=results,
        expansions=expansion_map,
        viz_data=viz_data,
        debug=debug_info
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
    index: Index, raw_term: str, expansions_log: Dict[str, List[str]], use_prefix_expansion: bool = True
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
    expanded = expand_term(index, raw_term, use_prefix_expansion=use_prefix_expansion)
    if expanded:
        expansions_log.setdefault(raw_term, expanded)
    if not expanded:
        return np.zeros(N)

    raw_stem = _STEMMER.stem(raw_term.lower())
    memberships = []
    for term in expanded:
        m = _single_term_membership(index, term)
        # Apply 0.5 weight to expansion terms (not the stem)
        if term != raw_stem:
            m = m * 0.5
        memberships.append(m)

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
    viz_data: Optional[dict] = None
    debug: Optional[dict] = None


def extended_boolean_search(
    index: Index, query: str, p: float = 2.0, top_k: int = 20, use_prefix_expansion: bool = True
) -> BooleanOutcome:
    """
    Fuzzy boolean ranking using the p-norm model.
    Supports query operators AND, OR, NOT and nested parentheses.
    """
    if not index.documents:
        return BooleanOutcome()

    tokens = _tokenize_boolean_query(query)
    if not tokens:
        return BooleanOutcome()

    rpn = _shunting_yard(tokens)
    stack: List[np.ndarray] = []
    expansion_map: Dict[str, List[str]] = {}

    for tok in rpn:
        if tok == "AND":
            if len(stack) < 2: continue
            b = stack.pop()
            a = stack.pop()
            stack.append(_p_norm_and([a, b], p))
        elif tok == "OR":
            if len(stack) < 2: continue
            b = stack.pop()
            a = stack.pop()
            stack.append(_p_norm_or([a, b], p))
        elif tok == "NOT":
            if len(stack) < 1: continue
            a = stack.pop()
            stack.append(_p_norm_not(a))
        else:
            # Atomic term
            stack.append(_term_membership(index, tok, expansion_map, use_prefix_expansion))

    if not stack:
        return BooleanOutcome(expansions=expansion_map)

    final_scores = stack.pop()
    
    # Per-document debug for boolean
    results = []
    indices = np.argsort(-final_scores)[:top_k]
    
    # We need the individual term scores to show "Why this document matched"
    # Re-evaluate atomic terms for the top results
    term_tokens = [t for t in rpn if t not in _OPERATORS]
    
    for idx in indices:
        if final_scores[idx] <= 0:
            continue
            
        memberships = {}
        for tok in term_tokens:
            m_vec = _term_membership(index, tok, {}, use_prefix_expansion)
            memberships[tok] = round(float(m_vec[idx]), 4)

        doc = index.documents[idx]
        results.append(SearchResult(
            filename=doc.filename,
            snippet=doc.snippet,
            score=float(final_scores[idx]),
            debug={"memberships": memberships}
        ))

    top_memberships = {}
    top_score = 0
    if results:
        top_idx = 0
        # Find the actual index in the document collection for the top result
        for i, d in enumerate(index.documents):
            if d.filename == results[0].filename:
                top_idx = i
                break
        top_score = float(final_scores[top_idx])
        
        # Get unique atomic terms from RPN (excluding operators)
        atomic_terms = [t for t in rpn if t not in _OPERATORS]
        for t in atomic_terms:
            # Use the same expansion logic as the search itself
            m_vec = _term_membership(index, t, {}, use_prefix_expansion)
            top_memberships[t] = float(m_vec[top_idx])

    debug_info = {
        "rpn": rpn,
        "p": p,
        "formula": f"p-norm evaluation (p={p})",
        "top_memberships": top_memberships,
        "top_score": top_score
    }

    # 2. 3D Visualization Data Generation for Boolean
    # We'll use the same logic as vectorial for consistency
    # --- Visualization Prep ---
    target_dims = []
    # Identify atomic terms from the RPN to define axes
    all_query_terms = set([t for t in rpn if t not in _OPERATORS])
    
    if len(indices) > 0:
        doc_indices = list(indices)
        if doc_indices:
            sum_weights = index.tfidf[:, doc_indices].sum(axis=1)
            sorted_dims = np.argsort(-sum_weights)
            
            # Prioritize terms that are actually in the query for the axes
            for t in all_query_terms:
                t_idx = index.term_to_idx.get(t)
                if t_idx is not None and t_idx not in target_dims:
                    target_dims.append(t_idx)
                if len(target_dims) >= 3: break
            
            for d in sorted_dims:
                if len(target_dims) >= 3: break
                d_idx = int(d)
                if d_idx not in target_dims:
                    target_dims.append(d_idx)

    # Fallback: fill remaining axes with significant terms
    if len(target_dims) < 3:
        significant_dims = np.argsort(-index.idf)
        for d in significant_dims:
            if len(target_dims) >= 3: break
            d_idx = int(d)
            if d_idx not in target_dims:
                target_dims.append(d_idx)

    viz_data = None
    if len(target_dims) == 3:
        axes_labels = [index.vocabulary[i] for i in target_dims]
        q_point = [1.0 if index.vocabulary[i] in all_query_terms else 0.0 for i in target_dims]
        
        doc_points = []
        # Limit to top 5 for consistency
        for idx in indices[:5]:
            if final_scores[idx] <= 0: continue
            doc = index.documents[idx]
            pos = [float(index.tfidf[dim_idx, idx]) for dim_idx in target_dims]
            doc_points.append({
                "filename": doc.filename,
                "pos": pos,
                "score": float(final_scores[idx])
            })
        
        viz_data = {
            "query_string": query,
            "axes": axes_labels,
            "query": q_point,
            "documents": doc_points
        }

    return BooleanOutcome(results=results, expansions=expansion_map, viz_data=viz_data, debug=debug_info)
