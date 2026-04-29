---
name: coderecall behavior — actual vs. spec
description: Reverse-engineered from src/ on 2026-04-29. Captures what the Next.js webapp actually shipped vs. what SKILL.md described. Use this as the "what we have" baseline before rebuilding.
---

# coderecall — actual shipped behavior (from src/)

## TL;DR

**The rules engine shipped. The game UI never did.** `src/lib/*.ts` is a complete, production-quality reducer + scoring + tokenizer. `src/app/page.tsx` is still the default Next.js Vercel boilerplate. No question bank, no setup flow, no input UI, no results screen.

## What's in src/

| Layer | File | Status | Lines |
|---|---|---|---|
| Types | `lib/types.ts` | ✅ complete | 48 |
| Tokenizer | `lib/tokenizer.ts` | ✅ complete | 128 |
| Scoring | `lib/scoring.ts` | ✅ complete | 48 |
| State machine | `lib/gameState.ts` | ✅ complete | 139 |
| Page UI | `app/page.tsx` | ❌ default boilerplate | 65 |
| Components | `components/` | ❌ empty dir | 0 |
| Question bank | — | ❌ not seeded | 0 |

## The 3 reveal levels (verified — `tokenizer.ts:104-116`)

| Level | Display rule | Input check | Wrong penalty |
|---|---|---|---|
| **1 — Half Visible** | `T_b_e` (every other char shown) | first letter match (case-insensitive) | 0 (training wheels) |
| **2 — First Letter** | `T____` (first char + underscores) | first letter match | -1 |
| **3 — Full Recall** | `_____` (all underscores) | full word match (case-insensitive for SQL) | -3 (interview mode) |

## Scoring formula (verified — `scoring.ts`)

```
base = {1: 5, 2: 10, 3: 25}[level]
speed_bonus = 3 if t<2s, else 1 if t<5s, else 0
streak_mult = 1.5x at streak≥5, 2.0x at ≥10, 3.0x at ≥20
points = round((base + speed_bonus) * streak_mult)
```

Streak emoji: `🔥` at 5, `🔥🔥` at 10, `🔥🔥🔥` at 20.

## Keyword sets (verified — `tokenizer.ts:4-33`)

- **SQL** (~67 terms): SELECT/FROM/WHERE/JOIN/GROUP BY/HAVING/window funcs (ROW_NUMBER, LAG, LEAD, RANK), aggregates, CASE/WHEN, DDL (CREATE/ALTER/DROP), DATE_TRUNC/EXTRACT, etc.
- **Python/pandas** (~60 terms): keywords, builtins, pandas (`pd`, `df`, `read_csv`, `groupby`, `merge`, `iloc`, `loc`, `rolling`), matplotlib/seaborn (`plt`, `sns`).

Case sensitivity: SQL is case-insensitive in keyword lookup; Python is case-sensitive.

## State machine (verified — `gameState.ts`)

Reducer with 5 actions: `START_GAME` · `CORRECT_INPUT` · `WRONG_INPUT` · `NEXT_QUESTION` · `COMPLETE_SESSION`.

Auto-reveal: non-keyword tokens (literals like `'TSLA'`, `315`, `*`, commas) reveal automatically when a question loads. User only types keywords.

Tracks: score, streak, bestStreak, wrongAttempts, totalKeywords, correctKeywords, keywordTimes[] (per-token ms).

## Spec/reality drift (SKILL.md vs src/)

| SKILL.md claims | Reality |
|---|---|
| ASCII title screen with Tulving + Simon/Chase quotes | Not in code — no title screen at all |
| Setup: ticker → objective → language → level | Reducer accepts these but no UI prompts for them |
| Question bank tied to user's stock | No questions seeded; `Question[]` is passed in via `START_GAME` action with no source |
| "Stock-specific drill content" (e.g. "TSLA 30-day price", "MU revenue trend") | Zero questions exist |
| Session results / scoreboard | `COMPLETE_SESSION` flips a flag; no UI renders the result |
| Persistence between sessions | None — no localStorage, no save card |

## What this means for the rebuild

Three rebuild options, ordered by reuse:

1. **Keep lib/ verbatim, build only the missing layers** — UI, question bank, persistence. Lib is good code, ~363 LOC of working logic. Don't rewrite.
2. **Rebuild as a Claude skill (no Next.js)** — pure conversational, ASCII rendering, no React. Aligns with the rest of the fleet. Drop the webapp entirely; SKILL.md becomes the executable.
3. **Both** — Claude skill for daily drilling (works in chat); webapp for muscle-memory keyboard speed (browser-only). Different surfaces, shared rules.

## Anti-patterns to avoid in the rebuild

- **Don't rewrite tokenizer.ts** — keyword sets are well-curated, the half-visible / first-letter / full-recall logic is correct.
- **Don't change the scoring constants without a stress test** — 5/10/25 base + 3.0x streak ceiling was tuned; arbitrary edits will break the dopamine curve.
- **Don't auto-reveal keywords on hover or partial-match** — the whole point is cued recall.
- **Don't add multiple-choice fallback** — that's a different cognitive task (recognition vs. recall); SKILL.md explicitly rejects it.
- **Don't skip the question bank** — without seeded questions tied to a real ticker, the spec's "interview prep disguised as stock research" framing collapses.

## Files

- `SKILL.md` — original concept spec (468 lines) — preserved as-is from repo
- `BEHAVIOR.md` — this file — actual shipped behavior + spec/reality drift
