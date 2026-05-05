// Thin API client for the FastAPI backend.
// All endpoints are reverse-proxied under /api by the Replit workspace router.

export type SearchModel = "vectorial" | "boolean";

export type VectorialSimilarity = "cosine" | "scalar" | "euclidean" | "jaccard" | "dice" | "overlap";

export interface SearchResultItem {
  filename: string;
  snippet: string;
  score: number;
  debug?: {
    contributions?: Record<string, number>;
    memberships?: Record<string, number>;
  };
}

export interface SearchResponse {
  model: SearchModel;
  similarity?: VectorialSimilarity;
  p: number | null;
  query: string;
  total_documents: number;
  results: SearchResultItem[];
  expansions: Record<string, string[]>;
  viz_data?: {
    query_string: string;
    axes: [string, string, string];
    query: [number, number, number];
    documents: {
      filename: string;
      pos: [number, number, number];
      score: number;
    }[];
  };
  debug?: {
    formula: string;
    query_vectorization?: {
      term: string;
      tf: number;
      idf: number;
      final_weight: number;
    }[];
    query_vector_non_zero?: Record<string, number>;
    rpn?: string[];
    p?: number;
  };
}

export interface IndexStatus {
  documents: number;
  vocabulary: number;
  files: string[];
}

const API_BASE = "/api";

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as T;
}

export function getStatus(): Promise<IndexStatus> {
  return jsonFetch<IndexStatus>("/status");
}

export function reindex(): Promise<IndexStatus> {
  return jsonFetch<IndexStatus>("/reindex", { method: "POST" });
}

export function runSearch(params: {
  query: string;
  model: SearchModel;
  similarity?: VectorialSimilarity;
  p?: number;
  topK?: number;
  usePrefixExpansion?: boolean;
}): Promise<SearchResponse> {
  return jsonFetch<SearchResponse>("/search", {
    method: "POST",
    body: JSON.stringify({
      query: params.query,
      model: params.model,
      similarity: params.similarity ?? "cosine",
      p: params.p ?? 2.0,
      top_k: params.topK ?? 10,
      use_prefix_expansion: params.usePrefixExpansion ?? true,
    }),
  });
}
