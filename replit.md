# Modular Search Engine

## Overview

Full-stack Information Retrieval engine that indexes any `.txt`, `.pdf` or
`.json` file dropped into `artifacts/api-server/data/` and exposes two
ranking models:

- **Vectorial Model** — TF-IDF weighting + cosine similarity
- **Extended Boolean Model** — p-norm aggregation (Salton, Fox & Wu, 1983)
  with full `AND` / `OR` / `NOT` / parentheses support.

## Architecture

- **Backend** (`artifacts/api-server`, FastAPI + NumPy + NLTK)
  - `app/preprocessing.py` — tokenization, stop-word removal, Porter stemmer
  - `app/loader.py` — data-agnostic reader for txt / pdf / json
  - `app/indexer.py` — TF-IDF matrix, IDF vector, document norms
  - `app/models.py` — vectorial (cosine) and extended boolean (p-norm) search
  - `app/main.py` — FastAPI app exposing `/api/healthz`, `/api/status`,
    `/api/search`, `/api/reindex`
- **Frontend** (`artifacts/search-engine`, React + Vite + Tailwind v4 + Framer Motion)
  - **Glassmorphism design system** in `src/components/ui/`:
    `GlassCard`, `GlassButton`, `GlassInput`, `GlassToggleGroup`,
    `GlassSlider`, `Badge`, `Typography` (DisplayTitle, SectionTitle,
    DocumentTitle, Snippet, Mono, ScoreLabel)
  - Surface tokens (`.glass-surface`, `.glass-surface-strong`,
    `.glass-input`) defined in `src/index.css`
  - Page composition in `src/pages/SearchPage.tsx`

## Mathematical formulas

- TF (sub-linear): `tf_w = 1 + log10(tf)` if `tf > 0`, else `0`
- IDF: `idf_t = log10(N / df_t)`
- Cosine similarity: `sim(q,d) = (q·d) / (||q|| · ||d||)`
- Extended Boolean OR_p: `( (Σ w_i^p) / n )^(1/p)`
- Extended Boolean AND_p: `1 - ( (Σ (1-w_i)^p) / n )^(1/p)`
- NOT (fuzzy): `1 - w`

All formulas are documented inline in `app/models.py` and `app/indexer.py`
for project defense purposes.

## Adding documents

Drop any `.txt`, `.pdf` or `.json` file into
`artifacts/api-server/data/` and click **Reindex /data** in the UI (or
`POST /api/reindex`).
