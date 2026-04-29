---
name: coderecall
description: >
  SQL and Python/pandas first-letter cued-recall drill. Display = blanks only (length count visible, no letter hints anywhere). Input = the first letter, which YOU produce — system reveals the matching keyword. Built on Tulving cued-recall: position-in-context + word length = the cue, the user produces the letter. v0.1 = Level 1 keystone only — partial scaffolding (L2) and blind recall (L3) deferred until Level 1 reps prove insufficient.
  NOT for: cold question drill with grading (use examiner — no scaffolding, no cued-recall mechanic). NOT for: gamified DATAFLOW pipeline recall (use dataflow-millionaire — different content, Millionaire format). NOT for: conceptual SQL/pandas teaching via metaphor (use chef or .5 — explanation, not drill). NOT for: end-to-end pipeline code authorship (no skill exists yet for that).
metadata:
  version: 0.1.0
  last_reviewed: 2026-04-29
  spec_version: 0.2.0
composable_with:
  - examiner
  - price-desk
---

# coderecall — first-letter cued-recall drill

## Purpose

The keystone of code muscle memory. Show a SQL or pandas line with all keywords blanked (length-only, no letter hints). User types one first letter per blank — the system reveals the matching keyword. Per Tulving (1973): cued recall is faster, stronger, and more transferable than re-reading. The first letter is the **cue the user produces**, not a hint Claude shows.

Used between trade days for the fund work. Built to make `S F W A O B A L` reflex-tight before the user ever attempts to write SQL from a blank screen.

## When to trigger

- User types `.coderecall` / `.cr` → start session
- Natural language: "drill me on SQL", "first-letter recall", "code muscle memory", "cued recall drill"
- User pastes a save card block → resume from saved state

## When NOT to trigger

- User wants cold-drill question with grading → `examiner` (no recall scaffolding; you write the whole answer from scratch)
- User wants gamified DATAFLOW concept recall → `dataflow-millionaire` (Millionaire format, conceptual not syntactic)
- User wants conceptual SQL/pandas explanation → `chef` / `.5` / lens skills (metaphor-based teaching)
- User is mid-session in `examiner` or `dataflow-millionaire` → finish that first
- User wants to build a pipeline from scratch → no skill exists; write code conversationally

## The four locked rules (v0.1)

These came out of the rebuild walk on 2026-04-29. **Do not bypass.**

1. **First letter is user-supplied. Never shown by Claude.** Bible Memory Pro mechanic. The cue is position-in-context + word length, nothing else. Showing even one letter of a keyword in the prompt = bug.
2. **L1 display = blanks only, length visible.** Render each keyword as `_` × `len(keyword)`. Non-keywords (literals, table names, column names, operators) auto-reveal. No partial-letter patterns (`_e_e_t`, `_a_l_`) — those are L2's territory and L2 is deferred.
3. **Input parser accepts space-separated AND no-space.** `S F W A O B A L` and `safjowobgba` both work. Case-insensitive. The skill never punishes formatting choice.
4. **Clause-ordering errors are tracked separately from keyword-recall errors.** If user types `O B G B` instead of `G B O B`, that's not "didn't know GROUP" — that's "swapped GROUP BY and ORDER BY position." Different weak-spot class, different drill remedy (drill execution-order: `FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT`).

## Session flow

### Step 1 — Setup

Ask once at session start (or restore from save card):
- **Ticker** — the stock used in question prompts (default: TSLA). Single ticker keeps the canon stable.
- **Language** — `sql` (default) or `pandas`.
- **Session goal** — open-ended (user types `stop` to end) OR fixed length (e.g., 10 questions).

### Step 2 — Generate question

Claude produces ONE fresh question on the fly:

- Stock-themed scenario in 1 sentence (*"Get the 5 lowest-closing TSLA days in 2026"*)
- Canonical answer (the SQL or pandas one-liner)
- Tokenize answer: split into keywords (vs literals/identifiers/operators)
- Render display: keywords blanked as `_` × len, everything else shown

**Question generation constraints:**
- Use real fund tickers (TSLA, NVDA, MU, AAPL, GOOGL, META, AMD)
- Schema canon: `prices(ticker, date, open, high, low, close, volume)` + `tickers(ticker, sector, market_cap)`
- Vary keyword shape across walks: cover SELECT/FROM/WHERE/JOIN/GROUP BY/HAVING/ORDER BY/LIMIT/AND/OR/IN/BETWEEN/AS/DISTINCT/COUNT/AVG/SUM/MIN/MAX/CASE/WHEN/THEN/ELSE/END
- Never repeat a question text within a save-card lineage (track via `seen` hash list in save card)

### Step 3 — Render

Display the prompt sentence + the blanked SQL/pandas line. Show underscore counts inline so the user can see word lengths:

```
Prompt: <one-sentence scenario>

______ * 
____ daily_prices 
_____ ticker = 'TSLA' ___ year = 2026 
_____ __ close ___ 
_____ 5;
```

End with the inline cue: *"Type your first-letter sequence (`s f w a o b a l` OR `sfwaobal` — both fine)."*

### Step 4 — Score

Parse user input → split into letters (handle both formats) → compare to expected first letters in order. For each slot:
- Match → ✅, +5 points × current streak multiplier
- Miss → ❌, no penalty in v0.1 (training wheels), streak resets, weak spot logged
- Special: if user's letter matches a DIFFERENT expected keyword from later in the sequence → flag as **clause-ordering error** instead of recall miss

Scoring constants (matches webapp lib/scoring.ts):
- Base: 5 points per correct first-letter
- Streak multiplier: 1.5× at streak ≥5, 2.0× at ≥10, 3.0× at ≥20
- Streak emoji: 🔥 at 5, 🔥🔥 at 10, 🔥🔥🔥 at 20
- Wrong penalty: 0 in v0.1 (training wheels). Add when user reports L1 feels too easy.

### Step 5 — Reveal + log

Display the full SQL with all keywords filled in, even on misses. Show:
- Score row: `8/11 ✅ · +30 pts · streak 4 🔥`
- Misses row: list each missed keyword with its slot
- Weak-spot accumulator: append to in-session list

### Step 6 — Next or stop

Prompt: *"Next? `y` for new question, `same` to redo this one, `stop` to end."*

### Step 7 — End of session

On `stop`:
- Show final score, best streak, total questions answered
- List weak spots (most-missed keywords + clause-order errors)
- Emit save card

## Save card format

```
--- CODERECALL SAVE ---
Player: [NAME]
Ticker: [TICKER]
Language: [sql|pandas]
Total Score: $[AMOUNT]
Best Streak: [N]
Sessions: [N]
Weak Spots: [comma list of keywords]
Clause-Order Errors: [comma list, e.g. "GROUP BY/ORDER BY swap (3x)"]
Mastered: [comma list — keywords with 5+ correct in a row, no misses]
Last Session: [ISO date]
Seen-Question-Hashes: [hash1, hash2, ...]
--- END ---
```

## Anti-patterns

- **Showing first letters at any difficulty level.** Webapp tokenizer.ts case 2 did this — bug. The first letter is always user-supplied.
- **Partial-letter rendering at L1.** `_e_e_t` is L2 territory, deferred. L1 is pure underscores + length.
- **Punishing formatting.** `S F W A` and `sfwa` are equivalent input. Don't reject either.
- **Reusing questions within a save card.** Hash-check against `Seen-Question-Hashes`.
- **Conflating clause-ordering with keyword-recall.** Different weak-spot class, different remedy. If user knows GROUP and ORDER but swaps them, the fix is execution-order drill, not keyword drill.
- **Silently building L2/L3 modes before they earn it.** Per `feedback_wait_time_decay.md`: defer until user reports L1 feels too easy after 50+ reps.
- **Letting streak emoji creep below the threshold.** 🔥 at 5+. Not 4. Not "close to 5." Threshold is the threshold.

## Exit conditions

- User types `stop` / `quit` / `pause` → emit save card, exit
- User types `restart` → confirm, re-setup
- 60 minutes inactivity → auto-pause with save card emission
- Session length goal reached (if fixed) → auto-stop with save card
- User invokes another skill → auto-pause with save card

## Non-goals

- **Multiple-choice fallback.** Recognition ≠ recall. The skill explicitly rejects MC even as a "lifeline."
- **Question banks shipped with the skill.** Questions are AI-generated per session; no static SQL question file. Keeps content fresh, prevents memorization of specific queries instead of the keyword reflex.
- **Cross-language sessions.** One language per session — switching SQL ↔ pandas mid-session breaks the muscle-memory loop.
- **Webapp parity.** v0.1 is conversational only. The Next.js app at `~/Desktop/CLAUDE CODE/coderecall/` is parked. If the chat surface validates after weeks of use, port to webapp for keyboard-tempo drilling.
- **L2 (partial scaffolding) and L3 (blind recall).** Deferred per wait-time-decay rule. Add when user reports L1 reflex is reflex-tight and feels too easy after 50+ reps.

## Future modes (deferred — add only when triggered)

| Mode | Trigger condition |
|---|---|
| **L2 — partial-letter scaffolding** (`_a_l_` style, full word required) | User reports 50+ L1 reps and L1 feels too easy / not challenging enough |
| **L3 — blind recall** (no display at all, type full SQL from prompt) | User completes L2 with ≥80% accuracy across 30 reps |
| **Pandas mode** | User explicitly requests pandas; SQL drill rate > 100 sessions |
| **Speed mode** (timed, time-to-letter scored) | User reports they want stopwatch pressure |
| **Webapp port** | User reports chat round-trip latency is the limiting factor on rep frequency |

## Composes with

- **`examiner`** — coderecall's weak-spots can feed examiner's weighted-question generation. Shared schema: `data/weak-spots.jsonl` keyed by `keyword` and `clause-order-error`.
- **`price-desk`** — when generating questions, can reference live tickers via price-desk to keep canon current.

## Trigger phrase reference

| User says | coderecall does |
|---|---|
| `.coderecall` / `.cr` | start new session (or resume from pasted save card) |
| `.cr resume` | scan for most recent save card and resume |
| `same` mid-session | redo current question |
| `stop` / `quit` / `pause` | emit save card, exit |
| `weak` mid-session | bias next 3 questions toward current weak spots |
| `harder` mid-session | (deferred — L2 unlock condition not met) |

## Failure modes guarded against

- **Webapp's first-letter-show bug** — locked rule #1 prevents
- **L2/L3 mode creep** — locked design + non-goals + future-modes table
- **Format gatekeeping** — locked rule #3
- **Clause-order misclassification** — locked rule #4
- **Question repetition** — `Seen-Question-Hashes` in save card
- **Memory dependency** — all rules + scoring + save format live in this SKILL.md
