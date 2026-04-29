---
name: coderecall — architecture
description: Why the v0.1 skill is structured the way it is. Captures the design constraints from the 2026-04-29 rebuild walk so future-you doesn't reverse-engineer them out.
---

# coderecall — architecture (v0.1)

## Three structural choices, in order of how much they constrain everything else

### 1. Level 1 only (keystone-first)

The webapp shipped 3 levels (Half Visible / First Letter / Full Recall) but never built the UI around them. The rebuild walk on 2026-04-29 produced one keystone insight: **Level 1 is not "easy mode," it's the load-bearing layer.** L2/L3 only matter once the L1 reflex is reflex-tight.

Per `feedback_wait_time_decay.md`, building L2/L3 before L1 has been validated by reps means: by the time the user actually graduates, the L2/L3 design intent has decayed and probably doesn't fit anymore. Defer.

**Implication:** the entire skill collapses around one display rule (`'_' × len`), one input rule (first letter), one scoring rule (base 5 × streak mult). No level switching, no per-keyword graduation, no display-mode conditionals. v0.1 is small.

### 2. First letter is user-supplied, never shown

The webapp's `tokenizer.ts` case 2 rendered `word[0] + '_' × (len-1)` — i.e., it showed the first letter at "First Letter" mode. That's backwards from Bible Memory Pro (the canon Danny was modeling on): the first letter is the *cue the user produces*, the system's job is to *reveal the matching word*.

This bug was load-bearing in the webapp design and would have shipped if the UI had ever been built. The rebuild rule (`first letter is always user-supplied`) is the correction.

**Implication:** L1 display is `_` × len, period. No alternating letters. No first-letter peek. The cue is **position-in-context + word length**, nothing else.

### 3. Question generation is AI, not a static bank

The webapp expected `Question[]` to be passed in via `START_GAME` action — but the question bank was never seeded. The skill would have shipped empty.

Going AI-gen per session is the right design anyway: a static bank means users memorize the queries instead of the keyword reflex (which is the whole point). Fresh questions every session, hash-tracked to prevent repetition within a save-card lineage.

**Implication:** Claude generates questions inline using the canonical schema (`prices(ticker, date, open, high, low, close, volume)` + `tickers(ticker, sector, market_cap)`). No external dependency. Stock-themed questions tie to fund tickers (TSLA, NVDA, MU, etc.) so the drill stays in the work domain.

## Why the save-card pattern (vs JSONL log)

`dataflow-millionaire` already uses save cards (paste-block at start, emit at end). Reusing the pattern means:

1. **No persistence layer to build** — the save card IS the persistence. User pastes, Claude parses.
2. **Cross-tool portable** — save card works in any new chat / agent / Cowork session. JSONL would require disk access from the chat surface.
3. **User has visibility** — they can edit the save card by hand (e.g., reset weak spots, increment session count for testing).
4. **Failure mode is recoverable** — lost save card = start fresh, no corrupted state.

Trade-off: save cards don't scale to long history (1000+ sessions). When that hits, port to `data/sessions.jsonl` — but per wait-time-decay, build that when it hits, not before.

## Why no penalty in v0.1

Webapp had Level 1 = 0 penalty, Level 3 = -3 penalty. v0.1 inherits L1 = 0 penalty (training wheels). When the skill graduates to L2/L3, penalties graduate too.

Reasoning: penalties on the keystone layer create avoidance — user skips coderecall on hard days. The keystone needs to be a place you WANT to come back to, even when tired. Streak rewards (1.5x → 3x multipliers) provide the carrot; penalties stay parked.

## Why these compositions (and not others)

- **`examiner`** — shares the `data/weak-spots.jsonl` schema. coderecall's misses can become tomorrow's examiner cold-drill questions. One-way data flow: coderecall writes weak-spots, examiner reads them. No reverse coupling.

- **`price-desk`** — when generating questions, Claude can reference live tickers via price-desk to keep canon current (e.g., "5 cheapest TSLA days in 2026" — verify TSLA is in current watchlist). Optional, not required for v0.1.

**Not composed with:**
- `dataflow-millionaire` — different domain (DATAFLOW concepts vs SQL keywords). No shared state.
- `chef` / `eli5` / lens skills — those teach via metaphor; coderecall drills via mechanics. Different cognitive task.
- `dataflow-tutor` / `dataflow-builder` (when built) — pipeline-shaped skills; coderecall is keyword-shaped.

## State surface

| State | Lives in | Lifetime |
|---|---|---|
| Current question | session memory | one question |
| Score, streak | session memory | one session |
| Weak spots | save card + `data/weak-spots.jsonl` | persistent |
| Best streak record | save card | persistent |
| Seen-question hashes | save card | per save-card lineage |
| Total sessions | save card | persistent |

`data/weak-spots.jsonl` is the only on-disk state. Everything else is conversational + save-card-mediated.

## What v0.2+ might add (deferred, with trigger conditions)

| Feature | Trigger condition |
|---|---|
| L2 — partial scaffolding | User reports 50+ L1 reps and L1 feels reflex-tight |
| L3 — blind recall | User completes L2 ≥80% across 30 reps |
| Pandas/Python keywords | User explicitly asks (SQL has volume now) |
| Speed mode (timed) | User asks for stopwatch pressure |
| Webapp port | Chat round-trip latency limits rep frequency |
| Streak-decay logic | Daily-use pattern emerges (else streaks span weeks meaninglessly) |

Each row above is a parked design — don't pre-build, don't pre-design. When the trigger hits, design from current need, not stale intent.
