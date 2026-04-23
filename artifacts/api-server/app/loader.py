"""
Data-agnostic document loader.

Reads any combination of .txt, .json and .pdf files inside the configured
/data folder and returns a normalized list of (filename, raw_text) records.

Design notes
------------
* The engine never assumes anything about the dataset content. Any folder
  with text files works.
* For JSON we flatten all string values into a single text blob — this is a
  pragmatic default that works for arbitrary schemas (articles, tweets,
  product catalogs, etc.).
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import List

from pypdf import PdfReader


@dataclass
class RawDocument:
    """A single document as loaded from disk, before preprocessing."""
    filename: str
    text: str


def _read_txt(path: str) -> str:
    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def _read_pdf(path: str) -> str:
    reader = PdfReader(path)
    parts = []
    for page in reader.pages:
        try:
            parts.append(page.extract_text() or "")
        except Exception:
            # PDF extraction is best-effort; skip pages that fail.
            continue
    return "\n".join(parts)


def _flatten_json(value) -> List[str]:
    """Recursively collect every string leaf in a JSON structure."""
    out: List[str] = []
    if isinstance(value, str):
        out.append(value)
    elif isinstance(value, dict):
        for v in value.values():
            out.extend(_flatten_json(v))
    elif isinstance(value, list):
        for v in value:
            out.extend(_flatten_json(v))
    return out


def _read_json(path: str, display_name: str | None = None) -> List[RawDocument]:
    """
    JSON support strategy:
      * If the top-level is a list, treat each element as a separate document.
      * Otherwise treat the whole file as a single document.
    All string leaves are concatenated to form the document text.

    `display_name` is the path used in the UI (relative to /data); falls back
    to the file's basename when called outside the directory walker.
    """
    label = display_name or os.path.basename(path)
    with open(path, "r", encoding="utf-8", errors="ignore") as fh:
        try:
            data = json.load(fh)
        except json.JSONDecodeError:
            return [RawDocument(filename=label, text=_read_txt(path))]

    if isinstance(data, list):
        docs: List[RawDocument] = []
        for i, item in enumerate(data):
            text = "\n".join(_flatten_json(item))
            docs.append(RawDocument(filename=f"{label}#{i}", text=text))
        return docs
    return [RawDocument(filename=label, text="\n".join(_flatten_json(data)))]


def load_documents(data_dir: str) -> List[RawDocument]:
    """
    Walk `data_dir` and return all readable documents.

    Supported extensions: .txt, .pdf, .json
    Files with other extensions are silently skipped.
    """
    docs: List[RawDocument] = []
    if not os.path.isdir(data_dir):
        return docs

    for root, _dirs, files in os.walk(data_dir):
        for name in sorted(files):
            path = os.path.join(root, name)
            # Display the path RELATIVE to /data so nested corpora keep
            # their folder context (e.g. "cats/intro.txt" vs "dogs/intro.txt"),
            # which prevents collisions when the same basename appears in
            # different sub-folders.
            rel = os.path.relpath(path, data_dir).replace(os.sep, "/")
            ext = os.path.splitext(name)[1].lower()
            try:
                if ext == ".txt":
                    docs.append(RawDocument(filename=rel, text=_read_txt(path)))
                elif ext == ".pdf":
                    docs.append(RawDocument(filename=rel, text=_read_pdf(path)))
                elif ext == ".json":
                    docs.extend(_read_json(path, display_name=rel))
            except Exception:
                # A single broken file should not crash the whole indexer.
                continue
    return docs
