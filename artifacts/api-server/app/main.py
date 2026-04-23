"""
FastAPI entry point.

Exposes:
    GET  /api/healthz         -> health check
    GET  /api/status          -> index statistics (docs, vocabulary, files)
    POST /api/search          -> run a query against one of the two models
    POST /api/reindex         -> rebuild the index from /data on demand

All endpoints are served under the /api prefix so the workspace proxy can
route them correctly to this Python service.
"""

from __future__ import annotations

import logging
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .indexer import DEFAULT_DATA_DIR, Index, build_index, index_stats
from .models import extended_boolean_search, vectorial_search

logger = logging.getLogger("search-engine")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ---------------------------------------------------------------------------
# App + CORS
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Modular Search Engine",
    version="1.0.0",
    description="TF-IDF (Vectorial) and Extended Boolean (p-norm) search engine.",
)

# CORS is permissive in dev because the frontend is served from a different
# port via the proxy. In production both share the same domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Index lifecycle
# ---------------------------------------------------------------------------
# We build the index once at startup and keep it in memory. For larger
# corpora this would be persisted to disk, but for the academic-scale
# datasets this engine targets, in-memory is more than enough.
_INDEX: Index = Index()


def _rebuild_index() -> None:
    global _INDEX
    logger.info("Building index from %s", DEFAULT_DATA_DIR)
    _INDEX = build_index(DEFAULT_DATA_DIR)
    logger.info(
        "Index ready: %d documents, %d unique terms",
        len(_INDEX.documents),
        len(_INDEX.vocabulary),
    )


@app.on_event("startup")
def _on_startup() -> None:
    _rebuild_index()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class SearchRequest(BaseModel):
    query: str = Field(..., description="The user's search query.")
    model: Literal["vectorial", "boolean"] = Field(
        "vectorial",
        description="Ranking model to use: 'vectorial' (TF-IDF + cosine) "
        "or 'boolean' (Extended Boolean p-norm).",
    )
    p: Optional[float] = Field(
        2.0,
        ge=1.0,
        le=20.0,
        description="p value for the Extended Boolean model. "
        "p=1 -> lenient, p->∞ -> strict (classical boolean).",
    )
    top_k: int = Field(10, ge=1, le=100, description="Maximum results to return.")


class SearchResponseItem(BaseModel):
    filename: str
    snippet: str
    score: float


class SearchResponse(BaseModel):
    model: str
    p: Optional[float]
    query: str
    total_documents: int
    results: List[SearchResponseItem]


class StatusResponse(BaseModel):
    documents: int
    vocabulary: int
    files: List[str]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/api/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/api/status", response_model=StatusResponse)
def status() -> StatusResponse:
    return StatusResponse(**index_stats(_INDEX))


@app.post("/api/reindex", response_model=StatusResponse)
def reindex() -> StatusResponse:
    _rebuild_index()
    return StatusResponse(**index_stats(_INDEX))


@app.post("/api/search", response_model=SearchResponse)
def search(req: SearchRequest) -> SearchResponse:
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    if req.model == "vectorial":
        results = vectorial_search(_INDEX, req.query, top_k=req.top_k)
    elif req.model == "boolean":
        results = extended_boolean_search(
            _INDEX, req.query, p=req.p or 2.0, top_k=req.top_k
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown model: {req.model}")

    return SearchResponse(
        model=req.model,
        p=req.p if req.model == "boolean" else None,
        query=req.query,
        total_documents=len(_INDEX.documents),
        results=[SearchResponseItem(**r.to_dict()) for r in results],
    )
