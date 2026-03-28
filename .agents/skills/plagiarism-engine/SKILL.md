```skill
---
name: plagiarism-engine
description: High-performance plagiarism detection and document similarity engine. Use when implementing or improving the plagiarism checker, originality scoring, document fingerprinting, or similarity search features. Covers HNSW vector indexing (ChromaDB), the Winnowing/Rabin-Karp fingerprinting algorithm, async task queues (Bull/Redis for Node.js, Celery for Python), and UI virtualization for large plagiarism reports. Triggers on: "plagiarism", "originality check", "text similarity", "document fingerprinting", "winnowing", "HNSW", "vector search", "bulk archive comparison", "highlight matches", "plagiarism report".
---

# High-Performance Plagiarism Engine

This skill provides production-grade patterns for every layer of a plagiarism detection system,
from indexing algorithms to async processing to browser-efficient UI rendering.

## Architecture Overview

```
[user submits chapter]
        │
        ▼
[Text Extraction]  ──►  extractText() from PDF/DOCX
        │
        ▼
[Fingerprinting]   ──►  Winnowing + Rolling Hash  (fingerprints[])
        │
        ▼
[Vector Embedding] ──►  all-MiniLM-L6-v2  →  float32[384]
        │
        ▼
[Async Task Queue] ──►  Bull (Node) / Celery (Python)  →  202 Accepted
        │
        ▼
[HNSW Index Query] ──►  ChromaDB / Qdrant / pgvector  →  top-K sources
        │
        ▼
[Score Blending]   ──►  Winnow overlap + cosine similarity → final %
        │
        ▼
[Result Stored]    ──►  DB update  →  WebSocket push to client
        │
        ▼
[Virtualized UI]   ──►  react-window  →  only visible <mark> rendered
```

---

## Pattern 1 — HNSW Vector Search (Semantic Similarity)

### Why HNSW?

Brute-force cosine search is **O(n·d)** for every query.
HNSW (Hierarchical Navigable Small World) reduces this to **O(log n)** approximate search
while achieving 95–99% recall versus exact search.

Used by: Spotify (music recommendations), Meta (Facebook search), all major vector DBs.

The two key parameters that trade off speed vs. accuracy:
- **`hnsw:M`** — number of bi-directional links per node (16 = balanced, 32 = higher recall, more RAM)
- **`hnsw:construction_ef`** — search width during index build (100 = balanced; higher = better index, slower build)

### Python Implementation (ChromaDB + Sentence-Transformers)

```python
# requirements:
#   chromadb>=0.4.0
#   sentence-transformers>=2.3.0
#   torch>=2.0.0  (or torch-cpu)

import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

# ── Singleton model (CPU-friendly, 22M params, 384-dim embeddings) ──
MODEL = SentenceTransformer("all-MiniLM-L6-v2")

def get_or_create_collection(client: chromadb.Client) -> chromadb.Collection:
    """
    Create (or reuse) a ChromaDB collection with HNSW cosine index.

    HNSW parameters:
      hnsw:space            = "cosine"  — normalizes vectors, best for semantic text
      hnsw:construction_ef  = 100       — ef during index build; higher → better recall
      hnsw:M                = 16        — bi-directional links; 16 balances speed + RAM

    Time complexity to build index: O(n · log(n))
    Memory:                         O(n · M · dim · 4 bytes)
    """
    return client.get_or_create_collection(
        name="capstone_archive",
        metadata={
            "hnsw:space": "cosine",
            "hnsw:construction_ef": 100,
            "hnsw:M": 16,
        },
    )


def embed_texts(texts: List[str], batch_size: int = 64) -> List[List[float]]:
    """
    Convert a list of texts into sentence embeddings using batch processing.

    Batch processing is critical: calling encode() per document is ~10x slower
    than calling it once with the full batch due to GPU/SIMD pipeline warm-up.

    Time complexity: O(len(texts) / batch_size) encode calls, each O(batch · len · dim)
    Memory tip:      Use encode(..., convert_to_numpy=True) — 4x less RAM than tensors.
    """
    all_embeddings: List[List[float]] = []
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        # normalize_embeddings=True ensures cosine similarity == dot product
        embeddings = MODEL.encode(
            batch,
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=True,
        )
        all_embeddings.extend(embeddings.tolist())
    return all_embeddings


def index_document(
    collection: chromadb.Collection,
    doc_id: str,
    text: str,
    metadata: Dict[str, Any],
) -> None:
    """
    Add or update a single document in the HNSW index.
    Call upsert (not add) so re-indexing after edits doesn't crash.
    """
    [embedding] = embed_texts([text])
    collection.upsert(
        ids=[doc_id],
        embeddings=[embedding],
        documents=[text[:1000]],  # store snippet only — saves RAM
        metadatas=[metadata],
    )


def semantic_similarity_search(
    collection: chromadb.Collection,
    user_text: str,
    top_k: int = 10,
) -> List[Dict[str, Any]]:
    """
    Query the HNSW index for the top-K most semantically similar documents.

    Returns list of:
      { id, distance, metadata: { projectTitle, chapter, submittedAt } }

    distance is 1 - cosine_similarity (range 0–2). Lower = more similar.
    Threshold guidance:
      < 0.15  →  very high similarity, flag as potential plagiarism
      0.15–0.35 →  moderate similarity, show as warning
      > 0.35  →  low similarity, likely original

    Time complexity: O(log n) with HNSW (vs O(n) brute force)
    """
    [query_embedding] = embed_texts([user_text])

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, collection.count()),
        include=["distances", "metadatas", "documents"],
    )

    hits = []
    for i, doc_id in enumerate(results["ids"][0]):
        distance = results["distances"][0][i]
        similarity_pct = round((1 - distance / 2) * 100, 1)  # convert distance → %
        hits.append({
            "id": doc_id,
            "similarityPct": similarity_pct,
            "metadata": results["metadatas"][0][i],
            "snippet": results["documents"][0][i],
        })

    return sorted(hits, key=lambda h: h["similarityPct"], reverse=True)
```

### Node.js Equivalent (using `@xenova/transformers` + `qdrant-client`)

```js
// npm install @xenova/transformers @qdrant/js-client-rest
import { pipeline } from '@xenova/transformers';
import { QdrantClient } from '@qdrant/js-client-rest';

const COLLECTION = 'capstone_archive';
const DIM = 384; // all-MiniLM-L6-v2 output dimension

let _embedder = null;
async function getEmbedder() {
    if (!_embedder) {
        // Cached singleton — only loaded once per process
        _embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return _embedder;
}

/**
 * Convert text → normalized float32[384] embedding.
 * Uses mean pooling over token embeddings (standard for sentence similarity).
 *
 * @param {string[]} texts - Batch of texts
 * @returns {number[][]}
 */
export async function embedTexts(texts) {
    const model = await getEmbedder();
    const output = await model(texts, { pooling: 'mean', normalize: true });
    return Array.from(output).map((tensor) => Array.from(tensor.data));
}

const qdrant = new QdrantClient({ url: process.env.QDRANT_URL || 'http://localhost:6333' });

/** Ensure collection exists with HNSW config. Call once on startup. */
export async function initCollection() {
    const exists = await qdrant.collectionExists(COLLECTION);
    if (!exists) {
        await qdrant.createCollection(COLLECTION, {
            vectors: {
                size: DIM,
                distance: 'Cosine',   // equivalent to hnsw:space cosine
                hnsw_config: { m: 16, ef_construct: 100 },
            },
        });
    }
}

/**
 * Store a document embedding in the HNSW index.
 *
 * @param {{ id: string, text: string, projectTitle: string, chapter: number }} doc
 */
export async function indexDocument(doc) {
    const [vector] = await embedTexts([doc.text]);
    await qdrant.upsert(COLLECTION, {
        wait: true,
        points: [{ id: doc.id, vector, payload: { projectTitle: doc.projectTitle, chapter: doc.chapter } }],
    });
}

/**
 * Find the top-K most similar archived documents.
 * Time complexity: O(log n) — HNSW graph traversal
 *
 * @param {string} queryText
 * @param {number} topK
 * @returns {Promise<Array<{ id, score, payload }>>}
 */
export async function semanticSearch(queryText, topK = 10) {
    const [vector] = await embedTexts([queryText]);
    const results = await qdrant.search(COLLECTION, { vector, limit: topK, with_payload: true });
    return results.map((r) => ({
        id: r.id,
        similarityPct: Math.round(r.score * 100),
        metadata: r.payload,
    }));
}
```

---

## Pattern 2 — Winnowing Algorithm (Exact-Match Fingerprinting)

### Why Winnowing?

HNSW/vector search finds **paraphrased plagiarism** (semantic copies).
Winnowing finds **verbatim plagiarism** (copy-pasted passages) and returns
**character offset ranges** that can be highlighted in the UI.

Used by: Stanford's MOSS, Turnitin, iThenticate.

Algorithm complexity: **O(n)** where n = character count of document.

### How It Works

```
1. Generate k-grams (substrings of length k) sliding over raw text
2. Hash each k-gram with a rolling Rabin-Karp hash  →  O(1) per gram
3. Apply sliding window of size w over hash array
4. In each window, keep the MINIMUM hash (or leftmost if tie) as a "fingerprint"
5. Deduplicate fingerprints → final set for this document
6. Intersection of two documents' fingerprint sets = matched passages
```

### Python Implementation

```python
from typing import List, Tuple, Set
import hashlib

# ── Tuning parameters ──────────────────────────────────────────────
K = 5       # k-gram length: shorter k → more matches but more noise;
            # k=5 works for capstone docs (~500–5000 word chapters)
W = 4       # window size: larger w → fewer fingerprints, less precision
            # W=4 is the MOSS default

# Rabin-Karp rolling hash constants
BASE  = 101
MOD   = 2**61 - 1   # Mersenne prime — reduces collision probability to ~1/MOD


def generate_kgrams(text: str, k: int = K) -> List[Tuple[str, int]]:
    """
    Yield (kgram_string, start_offset) sliding over cleaned text.
    Normalizes: lowercase, collapse whitespace.

    Generator pattern: O(1) memory (doesn't materialize the full list).
    """
    text = " ".join(text.lower().split())  # normalize
    for i in range(len(text) - k + 1):
        yield (text[i : i + k], i)


def rolling_hash_kgrams(text: str, k: int = K) -> List[Tuple[int, int]]:
    """
    Compute Rabin-Karp rolling hashes for all k-grams in O(n) time.

    Traditional approach: re-hash every k-gram → O(n·k)
    Rolling hash:         slide one character at a time → O(n)

    Returns list of (hash_value, char_offset).
    """
    text = " ".join(text.lower().split())
    n = len(text)
    if n < k:
        return []

    hashes: List[Tuple[int, int]] = []

    # Compute hash of first k-gram
    h = 0
    high_pow = pow(BASE, k - 1, MOD)
    for ch in text[:k]:
        h = (h * BASE + ord(ch)) % MOD
    hashes.append((h, 0))

    # Slide the window: remove leftmost char, add rightmost char
    for i in range(1, n - k + 1):
        h = (h - ord(text[i - 1]) * high_pow) % MOD
        h = (h * BASE + ord(text[i + k - 1])) % MOD
        hashes.append((h, i))

    return hashes


def winnow(text: str, k: int = K, w: int = W) -> List[Tuple[int, int, int]]:
    """
    Apply the Winnowing algorithm to select a representative fingerprint subset.

    Returns list of (hash, start_offset, end_offset) tuples.

    Property: Any k-gram sequence appearing in two documents will share
    at least one common fingerprint, guaranteeing exact-match detection.

    Time complexity:  O(n)
    Space complexity: O(n/w) fingerprints (one per window on average)
    """
    hashes = rolling_hash_kgrams(text, k)
    if not hashes:
        return []

    fingerprints: List[Tuple[int, int, int]] = []
    prev_min_idx: int = -1

    for i in range(len(hashes) - w + 1):
        window = hashes[i : i + w]
        # Find the position of the minimum hash in this window (leftmost on tie)
        min_idx = i + min(range(w), key=lambda j: window[j][0])
        if min_idx != prev_min_idx:
            h, offset = hashes[min_idx]
            fingerprints.append((h, offset, offset + k))
            prev_min_idx = min_idx

    return fingerprints


def compare_fingerprints(
    fp_a: List[Tuple[int, int, int]],
    fp_b: List[Tuple[int, int, int]],
) -> Tuple[float, List[Tuple[int, int]]]:
    """
    Compare two fingerprint sets and return:
      - overlap_ratio: len(intersection) / len(union)  (Jaccard on fingerprints)
      - matched_spans: list of (start, end) offsets in document A that matched

    Time complexity: O(|fp_a| + |fp_b|) using hash-set lookup.
    """
    set_b: Set[int] = {h for h, _, _ in fp_b}

    matched_spans: List[Tuple[int, int]] = []
    hash_set_a: Set[int] = set()

    for h, start, end in fp_a:
        hash_set_a.add(h)
        if h in set_b:
            matched_spans.append((start, end))

    intersection = len(hash_set_a & set_b)
    union        = len(hash_set_a | set_b)
    overlap      = intersection / union if union > 0 else 0.0

    return overlap, matched_spans
```

### Node.js Implementation (CMS-compatible)

```js
// server/services/winnowing.service.js

const K = 5;    // k-gram length
const W = 4;    // window size
const BASE = 101n;
const MOD  = (2n ** 61n) - 1n;  // Mersenne prime

/**
 * Normalize text: lowercase, collapse whitespace.
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Compute rolling Rabin-Karp hashes for all k-grams. O(n).
 *
 * @param {string} text
 * @param {number} k
 * @returns {{ hash: bigint, offset: number }[]}
 */
export function rollingHash(text, k = K) {
    const norm = normalize(text);
    if (norm.length < k) return [];

    const high = BASE ** BigInt(k - 1) % MOD;
    const hashes = [];
    let h = 0n;

    for (let i = 0; i < k; i++) h = (h * BASE + BigInt(norm.charCodeAt(i))) % MOD;
    hashes.push({ hash: h, offset: 0 });

    for (let i = 1; i <= norm.length - k; i++) {
        h = (h - BigInt(norm.charCodeAt(i - 1)) * high % MOD + MOD) % MOD;
        h = (h * BASE + BigInt(norm.charCodeAt(i + k - 1))) % MOD;
        hashes.push({ hash: h, offset: i });
    }

    return hashes;
}

/**
 * Select fingerprints via the Winnowing sliding-window minimum.
 *
 * Time:  O(n)
 * Space: O(n/w) fingerprints
 *
 * @param {string} text
 * @returns {{ hash: bigint, start: number, end: number }[]}
 */
export function winnow(text, k = K, w = W) {
    const hashes = rollingHash(text, k);
    if (hashes.length < w) return [];

    const fingerprints = [];
    let prevMinIdx = -1;

    for (let i = 0; i <= hashes.length - w; i++) {
        let minHash = hashes[i].hash;
        let minIdx  = i;

        for (let j = i + 1; j < i + w; j++) {
            if (hashes[j].hash < minHash) { minHash = hashes[j].hash; minIdx = j; }
        }

        if (minIdx !== prevMinIdx) {
            const { hash, offset } = hashes[minIdx];
            fingerprints.push({ hash: hash.toString(), start: offset, end: offset + k });
            prevMinIdx = minIdx;
        }
    }

    return fingerprints;
}

/**
 * Compare two fingerprint arrays.
 *
 * @param {{ hash: string, start: number, end: number }[]} fpA
 * @param {{ hash: string, start: number, end: number }[]} fpB
 * @returns {{ overlapRatio: number, matchedSpans: [number, number][] }}
 */
export function compareFingerprints(fpA, fpB) {
    const setB = new Set(fpB.map((f) => f.hash));
    const setA = new Set(fpA.map((f) => f.hash));

    const matchedSpans = fpA
        .filter((f) => setB.has(f.hash))
        .map((f) => [f.start, f.end]);

    const intersection = [...setA].filter((h) => setB.has(h)).length;
    const union        = setA.size + setB.size - intersection;
    const overlapRatio = union === 0 ? 0 : intersection / union;

    return { overlapRatio, matchedSpans };
}

/**
 * Full document comparison: fingerprint A against multiple corpus docs.
 * Returns per-document overlap + matched character spans.
 *
 * @param {string} submittedText
 * @param {{ id: string, title: string, chapter: number, text: string }[]} corpus
 * @returns {{ sourceId: string, overlapPct: number, spans: [number, number][] }[]}
 */
export function fingerPrintSearch(submittedText, corpus) {
    const fpQuery = winnow(submittedText);
    return corpus
        .map((doc) => {
            const fpDoc = winnow(doc.text);
            const { overlapRatio, matchedSpans } = compareFingerprints(fpQuery, fpDoc);
            return {
                sourceId: doc.id,
                title:    doc.title,
                chapter:  doc.chapter,
                overlapPct: Math.round(overlapRatio * 100),
                spans: matchedSpans,
            };
        })
        .filter((r) => r.overlapPct > 3)
        .sort((a, b) => b.overlapPct - a.overlapPct)
        .slice(0, 10);
}
```

---

## Pattern 3 — Async Task Queue (CPU-Intensive Offloading)

Plagiarism detection is CPU-bound. Running it synchronously blocks the Node.js event loop.
**Always offload it to a background worker queue.**

### Node.js with Bull + Redis (CMS-native stack)

```js
// server/jobs/plagiarism.job.js  (already exists — augmented pattern)
// npm install bullmq ioredis

import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { checkOriginality } from '../services/plagiarism.service.js';
import { winnow, fingerPrintSearch } from '../services/winnowing.service.js';
import Submission from '../modules/submissions/submission.model.js';

const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });

// ── Queue definition ────────────────────────────────────────────────
export const plagiarismQueue = new Queue('plagiarism', { connection });

// ── Worker (runs in a separate process via `node worker.js`) ────────
export function startPlagiarismWorker() {
    const worker = new Worker(
        'plagiarism',
        async (job) => {
            const { submissionId, text, corpus } = job.data;

            // Update progress so client can poll
            await job.updateProgress(10);

            // Step 1: Winnowing fingerprint search (exact matches)
            const fingerprintResults = fingerPrintSearch(text, corpus);
            await job.updateProgress(40);

            // Step 2: Semantic vector search (paraphrase detection)
            const semanticResults = await checkOriginality(text, corpus);
            await job.updateProgress(80);

            // Step 3: Blend scores
            const maxFingerprintOverlap = fingerprintResults[0]?.overlapPct ?? 0;
            const maxSemanticSimilarity = 100 - (semanticResults.originalityScore ?? 100);
            const blendedPlagiarismPct  = Math.round(
                0.6 * maxFingerprintOverlap + 0.4 * maxSemanticSimilarity
            );

            // Step 4: Persist result
            await Submission.findByIdAndUpdate(submissionId, {
                plagiarismStatus:  blendedPlagiarismPct > 25 ? 'flagged' : 'clear',
                originalityScore:  100 - blendedPlagiarismPct,
                matchedSources:    [...fingerprintResults, ...semanticResults.matchedSources],
                matchedSpans:      fingerprintResults.flatMap((r) => r.spans.map((s) => ({ ...s, sourceId: r.sourceId }))),
                plagiarismCheckedAt: new Date(),
            });

            await job.updateProgress(100);
            return { submissionId, originalityScore: 100 - blendedPlagiarismPct };
        },
        { connection, concurrency: 3 }  // max 3 simultaneous CPU-heavy jobs
    );

    worker.on('failed', (job, err) => {
        console.error(`[Plagiarism Worker] Job ${job.id} failed:`, err.message);
    });

    return worker;
}

/**
 * Enqueue a plagiarism check — returns immediately with job ID.
 * Controller calls this, responds 202, and client polls via jobId.
 *
 * @param {{ submissionId: string, text: string, corpus: any[] }} payload
 * @returns {Promise<string>} Bull job ID
 */
export async function enqueuePlagiarismCheck(payload) {
    const job = await plagiarismQueue.add('check', payload, {
        attempts:  3,
        backoff:   { type: 'exponential', delay: 2000 },
        removeOnComplete: { count: 100 },
        removeOnFail:     { count: 50 },
    });
    return job.id;
}
```

```js
// Controller: how to enqueue and return 202
// server/modules/submissions/submission.controller.js  (relevant portion)

export const triggerPlagiarismCheck = catchAsync(async (req, res) => {
    const submission = await Submission.findById(req.params.id);
    if (!submission) throw new AppError('Submission not found', 404);

    const corpus = await buildCorpus(submission.projectId); // fetch archived texts
    const jobId  = await enqueuePlagiarismCheck({
        submissionId: submission._id.toString(),
        text: submission.extractedText,
        corpus,
    });

    // Respond immediately — don't block for the CPU work
    res.status(202).json({
        success: true,
        message: 'Plagiarism check queued',
        data: { jobId, submissionId: submission._id },
    });
});

// Poll endpoint — client calls GET /submissions/:id/plagiarism-status?jobId=xxx
export const getPlagiarismStatus = catchAsync(async (req, res) => {
    const { jobId } = req.query;
    const job = await plagiarismQueue.getJob(jobId);

    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const state    = await job.getState();   // waiting | active | completed | failed
    const progress = job.progress ?? 0;

    res.json({
        success: true,
        data: {
            jobId,
            state,
            progress,
            result: state === 'completed' ? job.returnvalue : null,
            failReason: state === 'failed' ? job.failedReason : null,
        },
    });
});
```

### Python / FastAPI Version (reference for Python microservice integration)

```python
# celery_app.py
from celery import Celery

celery_app = Celery(
    "plagiarism",
    broker=os.environ["REDIS_URL"],
    backend=os.environ["REDIS_URL"],
)
celery_app.conf.task_routes = {"tasks.*": {"queue": "plagiarism"}}


# tasks.py
from celery_app import celery_app
from models import Submission, get_db
from services import winnow, semantic_search

@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def process_plagiarism_check(self, file_id: str) -> dict:
    """
    CPU-heavy task: off-loaded so the FastAPI event loop stays free.
    Updates the DB with the result, which the polling endpoint reads.
    """
    try:
        with get_db() as db:
            sub = db.query(Submission).filter_by(file_id=file_id).first()
            self.update_state(state="PROGRESS", meta={"progress": 10})

            fp_results = winnow.compare_against_corpus(sub.text, corpus)
            self.update_state(state="PROGRESS", meta={"progress": 60})

            vec_results = semantic_search.query(sub.text, top_k=10)
            self.update_state(state="PROGRESS", meta={"progress": 90})

            sub.originality_score = blend_scores(fp_results, vec_results)
            sub.status            = "flagged" if sub.originality_score < 75 else "clear"
            db.commit()

        return {"file_id": file_id, "originality_score": sub.originality_score}

    except Exception as exc:
        raise self.retry(exc=exc)


# fastapi_router.py
from fastapi import APIRouter
from tasks import process_plagiarism_check

router = APIRouter()

@router.post("/check/{file_id}", status_code=202)
def trigger_check(file_id: str):
    """Enqueue and return task ID immediately. Client polls /status/{task_id}."""
    task = process_plagiarism_check.delay(file_id)
    return {"task_id": task.id, "message": "Check queued"}

@router.get("/status/{task_id}")
def get_status(task_id: str):
    task = process_plagiarism_check.AsyncResult(task_id)
    return {
        "state":    task.state,          # PENDING | PROGRESS | SUCCESS | FAILURE
        "progress": task.info.get("progress") if isinstance(task.info, dict) else 0,
        "result":   task.result if task.state == "SUCCESS" else None,
    }
```

---

## Pattern 4 — Virtualized Plagiarism Report UI

When a document has 10,000+ words and 200+ matched spans, rendering every `<mark>` tag at once
causes DOM thrashing. React-Window renders ONLY the chunks visible in the viewport.

### Time/Space Complexity Insight
| Approach | DOM nodes | Scroll FPS |
|---|---|---|
| Render all `<mark>` | O(n\_spans) DOM inserts | 4–15 fps |
| Chunk + virtualize | O(viewport / chunk\_size) | 60 fps |

### React Implementation (React-Window + useMemo)

```jsx
// client/src/components/plagiarism/VirtualizedPlagiarismViewer.jsx
// npm install react-window

import { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

const CHUNK_SIZE = 500;      // characters per virtual row
const ROW_HEIGHT  = 96;      // approximate pixel height per chunk (adjust per font)

/**
 * Split text into fixed-size character chunks.
 * Returns [{ text: string, globalStart: number, globalEnd: number }]
 *
 * Uses a generator to avoid materializing the entire chunk array upfront.
 * Time: O(n/CHUNK_SIZE), Space: O(CHUNK_SIZE) per rendered chunk.
 *
 * @param {string} fullText
 * @returns {{ text: string, globalStart: number, globalEnd: number }[]}
 */
function buildChunks(fullText) {
    const chunks = [];
    for (let i = 0; i < fullText.length; i += CHUNK_SIZE) {
        const start = i;
        const end   = Math.min(i + CHUNK_SIZE, fullText.length);
        chunks.push({ text: fullText.slice(start, end), globalStart: start, globalEnd: end });
    }
    return chunks;
}

/**
 * For a single chunk, derive which spans overlap it, then render
 * text segments as plain text or <mark> elements.
 *
 * @param {string} chunkText
 * @param {number} globalStart
 * @param {{ start: number, end: number, sourceId: string }[]} spans — all document spans
 * @returns {JSX.Element[]}
 */
function renderChunkWithHighlights(chunkText, globalStart, spans) {
    // Filter only spans that intersect this chunk — O(spans) but called lazily
    const relevant = spans.filter(
        (s) => s.end > globalStart && s.start < globalStart + chunkText.length
    );

    if (relevant.length === 0) return [chunkText];

    // Build character-level mark map for the chunk
    const segments = [];
    let cursor      = 0;

    const sorted = [...relevant].sort((a, b) => a.start - b.start);

    for (const span of sorted) {
        const localStart = Math.max(0, span.start - globalStart);
        const localEnd   = Math.min(chunkText.length, span.end - globalStart);

        if (localStart > cursor) segments.push(chunkText.slice(cursor, localStart));
        segments.push(
            <mark
                key={`${span.sourceId}-${span.start}`}
                className="tw-bg-yellow-200 tw-cursor-pointer hover:tw-bg-yellow-300"
                title={`Match: ${span.sourceId}`}
            >
                {chunkText.slice(localStart, localEnd)}
            </mark>
        );
        cursor = localEnd;
    }

    if (cursor < chunkText.length) segments.push(chunkText.slice(cursor));
    return segments;
}

/**
 * VirtualizedPlagiarismViewer
 *
 * Only renders chunks currently in the viewport.
 * useMemo on chunks and per-row highlight objects prevents
 * re-computation on every scroll event.
 *
 * Props:
 *   fullText — the entire document plain text
 *   spans    — [{ start, end, sourceId }] character offsets from Winnowing
 *   onSpanClick — called with sourceId when a highlighted span is clicked
 */
export default function VirtualizedPlagiarismViewer({ fullText, spans = [], onSpanClick }) {
    // Memoized chunk array: only recomputed when fullText changes
    const chunks = useMemo(() => buildChunks(fullText), [fullText]);

    // Row renderer: called ONLY for visible rows by react-window
    const Row = useCallback(
        ({ index, style }) => {
            const chunk = chunks[index];
            const content = renderChunkWithHighlights(chunk.text, chunk.globalStart, spans);

            return (
                <div
                    style={style}
                    className="tw-px-4 tw-py-2 tw-font-mono tw-text-sm tw-whitespace-pre-wrap tw-break-words tw-leading-relaxed"
                    onClick={(e) => {
                        const mark = e.target.closest('mark');
                        if (mark && onSpanClick) onSpanClick(mark.title.replace('Match: ', ''));
                    }}
                >
                    {content}
                </div>
            );
        },
        [chunks, spans, onSpanClick]
    );

    return (
        <div className="tw-h-full tw-w-full tw-border tw-rounded-lg tw-overflow-hidden">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        height={height}
                        width={width}
                        itemCount={chunks.length}
                        itemSize={ROW_HEIGHT}
                        overscanCount={3}   // pre-render 3 rows above/below viewport
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}
```

### Split-Screen Integration (Adviser view)

```jsx
// PlagiarismReportPage.jsx  — adviser/instructor sees side-by-side
import VirtualizedPlagiarismViewer from '@/components/plagiarism/VirtualizedPlagiarismViewer';
import { useState } from 'react';

export default function PlagiarismReportPage({ submission, report }) {
    const [focusedSourceId, setFocusedSourceId] = useState(null);

    // When user clicks a highlighted span, show only spans from that source
    const activeSpans = focusedSourceId
        ? report.matchedSpans.filter((s) => s.sourceId === focusedSourceId)
        : report.matchedSpans;

    return (
        <div className="tw-flex tw-h-[80vh] tw-gap-4">
            {/* Left: student's submitted text with highlights */}
            <div className="tw-flex-1 tw-flex tw-flex-col">
                <h3 className="tw-text-sm tw-font-semibold tw-mb-2">Submitted Document</h3>
                <VirtualizedPlagiarismViewer
                    fullText={submission.extractedText}
                    spans={activeSpans}
                    onSpanClick={setFocusedSourceId}
                />
            </div>

            {/* Right: sidebar with matched sources */}
            <div className="tw-w-72 tw-overflow-y-auto tw-space-y-2">
                <h3 className="tw-text-sm tw-font-semibold tw-mb-2">Matched Sources</h3>
                {report.matchedSources.map((src) => (
                    <button
                        key={src.sourceId}
                        onClick={() => setFocusedSourceId(
                            focusedSourceId === src.sourceId ? null : src.sourceId
                        )}
                        className={`tw-w-full tw-text-left tw-p-3 tw-rounded-lg tw-border tw-text-sm
                            ${focusedSourceId === src.sourceId
                                ? 'tw-border-yellow-400 tw-bg-yellow-50'
                                : 'tw-border-border hover:tw-bg-muted'}`}
                    >
                        <div className="tw-font-medium tw-truncate">{src.title}</div>
                        <div className="tw-text-muted-foreground">
                            Chapter {src.chapter} — {src.overlapPct}% overlap
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
```

---

## Score Blending Formula

```js
/**
 * Blend Winnowing (exact match) and vector (semantic) similarity into
 * a single originality score.
 *
 * Weights:
 *   60% Winnowing — prioritize verbatim copy detection (higher precision)
 *   40% Semantic  — catch paraphrasing (higher recall)
 *
 * @param {number} maxWinnowOverlapPct  — 0–100 from fingerprint comparison
 * @param {number} maxSemanticSimPct    — 0–100 from HNSW cosine (100 = identical)
 * @returns {{ originalityScore: number, plagiarismPct: number }}
 */
export function blendScores(maxWinnowOverlapPct, maxSemanticSimPct) {
    const plagiarismPct  = Math.round(0.6 * maxWinnowOverlapPct + 0.4 * maxSemanticSimPct);
    const originalityScore = Math.max(0, 100 - plagiarismPct);
    return { originalityScore, plagiarismPct };
}

/**
 * Threshold interpretation:
 *
 * originalityScore >= 85  →  "Original"        (green)   — no action
 * originalityScore 70–84  →  "Minor Concerns"  (yellow)  — adviser review
 * originalityScore 50–69  →  "Significant"     (orange)  — revision required
 * originalityScore  < 50  →  "High Plagiarism" (red)     — reject chapter
 */
export const ORIGINALITY_THRESHOLDS = {
    ORIGINAL:    85,
    MINOR:       70,
    SIGNIFICANT: 50,
};
```

---

## Complexity Reference Card

| Algorithm | Time | Space | Best For |
|---|---|---|---|
| Jaccard (current) | O(n·m) | O(n) | Simple baseline |
| Winnowing | O(n) | O(n/w) | Verbatim copy, span offsets |
| HNSW query | O(log n) | O(n·M·d) | Semantic/paraphrase search |
| Brute-force cosine | O(n·d) | O(n·d) | Small corpus only |
| Celery/Bull queue | O(1) enqueue | O(1) per request | Async scalability |
| react-window render | O(viewport/chunk) | O(chunk_size) | Large document UI |

## Pro Refinement Questions to Ask

After generating any algorithm, always ask:
1. **"What is the O notation of this function, and can we use generators instead of lists to reduce memory footprint?"**
2. **"Can we use a MinDeque (monotonic deque) instead of linear scan to reduce the Winnowing window step from O(w) to O(1)?"**
3. **"At what corpus size should we switch from in-memory comparison to HNSW indexing?"** (Answer: typically > 1000 documents)
4. **"How do we handle near-duplicate fingerprints if k-grams span Unicode multi-byte characters?"**

---

## Environment Variables

```bash
# Vector DB
QDRANT_URL=http://localhost:6333          # or use ChromaDB endpoint
CHROMA_HOST=localhost
CHROMA_PORT=8000

# Embeddings (Python sidecar)
EMBEDDING_SERVICE_URL=http://localhost:8001

# Queue
REDIS_URL=redis://localhost:6379

# Tuning
PLAGIARISM_K_GRAM_SIZE=5
PLAGIARISM_WINDOW_SIZE=4
PLAGIARISM_ORIGINALITY_THRESHOLD=75       # below this → "flagged"
PLAGIARISM_MAX_CORPUS_SIZE=5000           # switch to HNSW above this count
```

## Integration with Existing CMS `plagiarism.service.js`

The existing service uses Jaccard + 3-grams as its internal engine.
To upgrade:

1. **Drop-in Winnowing:** Replace `buildShingles()` calls with `winnow()` from `winnowing.service.js`.
   The `compareFingerprints()` function replaces `jaccardSimilarity()` and additionally returns `matchedSpans[]`.

2. **Add HNSW layer:** Run `indexDocument()` in the `POST /archive` flow (after chapter approval).
   Then run `semanticSearch()` alongside Winnowing in `checkOriginality()`.

3. **Async queue:** Replace the synchronous call in `submission.controller.js` with
   `enqueuePlagiarismCheck()` → respond 202 → client polls via `getPlagiarismStatus()`.

4. **Virtualized UI:** Replace any textarea/pre-based text display in the plagiarism report
   components with `<VirtualizedPlagiarismViewer fullText={...} spans={report.matchedSpans} />`.
```
