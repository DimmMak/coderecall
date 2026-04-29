# coderecall — changelog

## v0.1.0 — 2026-04-29

**Initial release.** Rebuild of the original Next.js webapp (`~/Desktop/CLAUDE CODE/coderecall/`) as a pure Claude skill.

### What shipped

- **Level 1 keystone only.** Display = blanks with length count visible. Input = first letter, user-supplied. Cue = position-in-context + length.
- **AI-generated questions.** No static bank. Stock-themed (TSLA, NVDA, MU, etc.) using canonical schema (`prices`, `tickers`).
- **Save card persistence.** Paste-mediated, no disk dependency. Schema in `SCHEMA.md`.
- **Weak-spots logging.** Shared `data/weak-spots.jsonl` schema with `examiner` for cross-skill drill weighting.
- **Clause-ordering errors tracked separately** from recall misses. Different weak-spot class, different remedy.
- **Streak multipliers** (1.5x at 5, 2x at 10, 3x at 20). 0 penalty in v0.1 (training wheels).
- **No-space input parsing.** Both `S F W A` and `sfwa` accepted.

### What did not ship (deferred)

Per `feedback_wait_time_decay.md` — these have explicit trigger conditions in SKILL.md "Future modes" table. Don't pre-build.

- L2 — partial-letter scaffolding (`_a_l_` style)
- L3 — blind recall (no display)
- Pandas keyword set
- Speed mode (timed)
- Webapp port

### Why this rebuild was needed

The original webapp shipped `lib/types.ts` + `lib/tokenizer.ts` + `lib/scoring.ts` + `lib/gameState.ts` (~363 LOC of working logic). But `app/page.tsx` was the default Next.js Vercel boilerplate — the UI was never built. The skill was vapor in the fleet manifest.

The rebuild walk on 2026-04-29 surfaced two webapp design bugs:
1. `tokenizer.ts` case 2 showed the first letter at "First Letter" mode. Per Bible Memory Pro canon, the first letter is the *user's cue*, never displayed. Locked rule #1 in v0.1.
2. The 3 levels were treated as parallel difficulty tiers. Actually L1 is the load-bearing keystone — the others are graduations from L1 reflex. Per `feedback_wait_time_decay.md`, deferred until L1 reps prove insufficient.

### Files

| File | Purpose |
|---|---|
| `SKILL.md` | Skill entry point — rules, flow, scoring |
| `ARCHITECTURE.md` | Why these structural choices (L1-only, blanks-only, save-card, etc.) |
| `SCHEMA.md` | Save-card format, weak-spots.jsonl, question hash |
| `CHANGELOG.md` | This file |
| `BEHAVIOR.md` | Reverse-engineered from webapp src/ — kept as historical reference |
| `_archive_2026-04-29_v0_webapp_spec.md` | Original 468-line concept spec (preserved per no-destructive-purges rule) |
