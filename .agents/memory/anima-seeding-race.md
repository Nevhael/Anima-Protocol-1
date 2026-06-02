---
name: Anima character seeding race
description: Why localStorage character seeding double-seeded and how the guard must work
---

# Character seeding double-seed under StrictMode

Anima characters are localStorage-backed (via `base44Client.js`), seeded once by
`src/lib/seedCharacters.js`, invoked from a `useEffect([])` in `App.full.jsx`.

**Bug:** the seed was async and set its `SEED_KEY` localStorage guard only *after*
the `await`+create loop. `main.jsx` wraps the app in `React.StrictMode`, which
double-invokes effects in dev, so both passes ran the loop before either set the
guard → every roster seeded twice (18 → 36).

**Rule:** any "seed/migrate once" routine triggered from an effect must be
race-safe against StrictMode's double invoke — use a module-level promise lock so
concurrent calls share one run (and/or set the guard synchronously before the
first await). Setting a localStorage guard only at the end is not enough.

**Why:** StrictMode intentionally double-fires effects in dev; an end-of-run guard
leaves a window where both runs proceed.

**How to apply:** when adding any new one-time seed/migration here, gate it the same
way (promise lock + a dedicated `*_SEED_KEY`). A module-level lock only covers one
tab; multi-tab simultaneous first-run is a known residual gap (not yet handled).

Note: the `api-server` dev workflow runs `build && start` (esbuild, no watch), so
restart that workflow to pick up backend source edits before curling endpoints.
