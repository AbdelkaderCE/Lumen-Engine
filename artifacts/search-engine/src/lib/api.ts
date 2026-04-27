// Thin API client for the FastAPI backend.
// All endpoints are reverse-proxied under /api by the Replit workspace router.

export type SearchModel = "vectorial" | "boolean";

export interface SearchResultItem {
  filename: string;
  snippet: string;
  score: number;
}

export interface SearchResponse {
  model: SearchModel;
  p: number | null;
  query: string;
  total_documents: number;
  results: SearchResultItem[];
  expansions: Record<string, string[]>;
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
  p?: number;
  topK?: number;
  usePrefixExpansion?: boolean;
}): Promise<SearchResponse> {
  return jsonFetch<SearchResponse>("/search", {
    method: "POST",
    body: JSON.stringify({
      query: params.query,
      model: params.model,
      p: params.p ?? 2.0,
      top_k: params.topK ?? 10,
      use_prefix_expansion: params.usePrefixExpansion ?? true,
    }),
  });
}
