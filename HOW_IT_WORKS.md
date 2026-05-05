# How Lumen Engine Works

Welcome to the inner workings of **Lumen Engine**! This document explains how the search engine takes your query and finds the most relevant documents, without getting bogged down in programming code. Instead, we'll focus on the logical and mathematical concepts.

---

## 1. The Preparation Phase (Indexing)

Before you can search for anything, the engine needs to read and understand the documents (the "corpus"). 

1. **Tokenization:** The engine reads every document and breaks sentences down into individual words, stripping away punctuation and making everything lowercase.
2. **Stopword Removal:** Common words that don't carry much meaning (like "the", "is", "and") are thrown away to save space and reduce noise.
3. **Stemming:** Words are reduced to their root forms. For example, "running", "runs", and "runner" might all be reduced to the stem "run". This ensures that a search for "run" will match a document containing "running".

---

## 2. The Core Concept: TF-IDF

At the heart of the engine is a weighting system called **TF-IDF** (Term Frequency - Inverse Document Frequency). This system assigns a numerical "importance" score to every word in every document.

*   **Term Frequency (TF):** How often does the word appear in this specific document? If a document mentions "apple" 10 times, it's probably more relevant to "apple" than a document that mentions it only once.
*   **Inverse Document Frequency (IDF):** How rare is the word across *all* documents? If the word "apple" appears in every single document in the system, it's not very helpful for finding a *specific* document. But if the word "xylophone" appears in only one document, it is highly identifying.

**The Equation:** `Importance = TF * IDF`
A word gets a high score if it appears *frequently* in the current document, but *rarely* across the entire collection.

---

## 3. The Vectorial Model

Imagine a giant 3D graph, but instead of 3 dimensions (X, Y, Z), it has thousands of dimensions—one for every unique word in the entire dictionary. 

Every document is plotted as a line (a "vector") in this massive graph, pointing in a specific direction based on its TF-IDF scores. When you type a query, the engine turns your query into its own vector and drops it into the same graph.

To find the best results, the engine measures how "close" the document vectors are to the query vector. We offer several ways to measure this "closeness" (Similarity Measures):

*   **Cosine:** Measures the *angle* between the query and the document. If they point in the exact same direction, the angle is 0, and the match is 100% perfect, regardless of how long the document is.
*   **Scalar (Dot Product):** A raw multiplication of the weights. Favors longer documents that mention the query words a lot.
*   **Euclidean:** Measures the literal, straight-line physical distance between the tip of the query vector and the tip of the document vector.
*   **Jaccard & Dice:** These measure "Overlap". They look at the size of the intersection (what the query and document share) compared to their total sizes. 
*   **Overlap (Coefficient de Superposition):** Looks purely at the shared intersection divided by the size of the smaller vector. Great for finding documents that fully encompass a short query.

---

## 4. The Extended Boolean Model (p-norm)

Sometimes you don't want a fuzzy similarity score; you want strict rules. You want documents that contain "Cats" **AND** "Dogs", but **NOT** "Birds". This is boolean logic.

However, strict boolean logic is harsh. If a document is a perfect masterpiece about Cats and Dogs, but mentions the word "Birds" exactly once, a strict `NOT "Birds"` query will completely delete it from the results.

To fix this, Lumen Engine uses the **Extended Boolean Model (p-norm)**, which introduces "Fuzzy Logic":

1. **Turning Weights into Truth:** First, the engine takes the TF-IDF weight of a word in a document and divides it by the highest TF-IDF weight for that word anywhere in the system. This gives a "Membership Score" between `0.0` (False) and `1.0` (True). A score of `0.8` means it is "80% True" that the document is about this word.
2. **The `p` value (Strictness):** The user can slide a `p` value to determine how strict the rules are:
    *   **Low p (e.g., 1.0):** The engine acts like a gentle average. `A AND B` will still give a decent score even if `B` is only slightly true.
    *   **High p (e.g., 5.0+):** The engine acts like strict logic. If `B` is false, `A AND B` fails completely.

Instead of simple True/False, the engine uses geometric formulas to calculate exactly *how true* a complex query is for a given document.

---

## 5. Summary of the Search Journey

1. You type a query: `"Quantum Computing"`
2. The engine cleans it up: `["quantum", "comput"]`
3. It creates a mathematical shape (Vector or Boolean Equation) out of those words.
4. It compares that shape against every document shape in the system simultaneously.
5. It ranks them from highest mathematical score to lowest.
6. It returns the top results to your screen!
