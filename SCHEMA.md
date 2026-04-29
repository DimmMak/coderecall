---
name: coderecall — schemas
description: Canonical formats for the save card, weak-spots log, and seen-questions hash list. Schema versions are pinned so v0.2+ migrations are explicit.
---

# coderecall — schemas (v0.1)

`schema_version: 0.1.0`

## 1. Save card (text block, paste-mediated)

Emitted at session end. User pastes at next session start. Claude parses by line.

```
--- CODERECALL SAVE ---
Player: [string, default "Player 1"]
Ticker: [4-letter uppercase, e.g. TSLA]
Language: [sql | pandas]
Total Score: $[integer]
Best Streak: [integer]
Sessions: [integer]
Weak Spots: [comma-separated keyword list]
Clause-Order Errors: [comma-separated entries, format "<from>/<to> swap (Nx)"]
Mastered: [comma-separated keywords with 5+ correct in a row, no misses]
Last Session: [ISO 8601 date, e.g. 2026-04-29]
Seen-Question-Hashes: [comma-separated 8-char hex hashes]
--- END ---
```

**Field rules:**

| Field | Type | Validation |
|---|---|---|
| `Player` | string | max 32 chars, no commas |
| `Ticker` | string | 1-5 uppercase letters |
| `Language` | enum | `sql` or `pandas` only |
| `Total Score` | integer | ≥ 0 |
| `Best Streak` | integer | ≥ 0 |
| `Sessions` | integer | ≥ 1 |
| `Weak Spots` | string list | each ≤ 32 chars, no internal commas |
| `Clause-Order Errors` | string list | format: `<KW1>/<KW2> swap (Nx)` |
| `Mastered` | string list | each ≤ 32 chars |
| `Last Session` | date | ISO 8601 (`YYYY-MM-DD`) |
| `Seen-Question-Hashes` | hex list | each exactly 8 chars |

**Sanity check (rejects forgery):**

`Total Score ≤ Sessions × 10000` — a session can produce ~5000 pts max with perfect streaks; double-cap at 10000 to allow for future multipliers. If a save card violates this, refuse to load.

## 2. Weak-spots log — `data/weak-spots.jsonl`

Append-only JSONL. Shared schema with `examiner` for cross-skill weak-spot weighting.

**One JSON object per line:**

```json
{"ts": "2026-04-29T14:32:11Z", "skill": "coderecall", "ticker": "TSLA", "language": "sql", "keyword": "AND", "context_before": "WHERE", "context_after": "year", "miss_type": "recall"}
```

**Field rules:**

| Field | Type | Notes |
|---|---|---|
| `ts` | ISO 8601 datetime | UTC |
| `skill` | string | `coderecall` for this skill |
| `ticker` | string | the session's ticker |
| `language` | enum | `sql` or `pandas` |
| `keyword` | string | the missed keyword (e.g. `AND`, `ASC`) |
| `context_before` | string | the keyword that came before in the answer |
| `context_after` | string | the keyword that came after |
| `miss_type` | enum | `recall` (didn't know it) or `clause-order` (knew it, wrong slot) |

**Why `context_before` / `context_after`:** weak spots cluster by syntactic neighborhood — `AND` after `WHERE` vs `AND` after `BETWEEN` are different reflexes.

**Cross-skill use:** `examiner` reads this file when generating tomorrow's drill, biases questions toward keywords with high recent-miss counts.

## 3. Clause-order error format (separate from recall miss)

When the user types a keyword that EXISTS in the expected sequence but at the WRONG slot, score as `miss_type: clause-order`. The save card aggregates these as:

```
Clause-Order Errors: GROUP BY/ORDER BY swap (3x), HAVING/WHERE swap (1x)
```

**Detection rule (in scoring logic):**

```
If user_letter[i] != expected[i]:
    If user_letter[i] in expected[i+1:i+5]:   # showed up later in real answer
        miss_type = "clause-order"
    Else:
        miss_type = "recall"
```

Window of `i+1:i+5` keeps it tight — only flags swaps within the same logical clause cluster (FROM → JOIN → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT).

## 4. Question hash (for seen-list)

8-char hex of the canonical answer string (lowercased, whitespace-collapsed):

```python
import hashlib
def question_hash(answer: str) -> str:
    canonical = ' '.join(answer.lower().split())
    return hashlib.sha1(canonical.encode()).hexdigest()[:8]
```

Hash collision rate at 8 chars: ~1 in 4 billion. Acceptable for personal save-card lineages.

**Use:** before generating a new question, hash the candidate's canonical answer; if it matches any entry in `Seen-Question-Hashes`, regenerate with different shape constraints.

## 5. Migration notes

**v0.1 → v0.2 (when L2/L3 unlock):**
- Add `Levels Unlocked: [comma list]` field to save card
- Add `level` field to weak-spots.jsonl entries (sql + pandas → level-1 / level-2 / level-3)
- Bump `schema_version` to `0.2.0`
- Old save cards load with `Levels Unlocked: 1` defaulted

**v0.1 → v0.2 (when pandas adds):**
- Already has `Language: sql | pandas` slot — no migration needed
- weak-spots.jsonl already has `language` field

Schema bumps are explicit. No silent additions.
