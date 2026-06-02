---
name: Anima typecheck scope
description: What the anima-protocol typecheck covers and why allowJs is intentionally off.
---

# Anima-protocol typecheck scope

The `typecheck` script (`tsc -p tsconfig.json --noEmit`) and the registered
`typecheck` validation step only check `.ts`/`.tsx` files. The vast majority of
the app is `.jsx`/`.js` (pages, hooks, most components) and is **not** type-checked.

**Why allowJs stays off:** enabling `allowJs` pulls the whole JS codebase into the
program and immediately surfaces pre-existing grammar-level errors (e.g. duplicate
JSX attributes report as TS17001 even without `checkJs`), which would balloon the
fix scope. Keep it off unless you intend to clean up the JS files.

**How to apply:**
- JS modules imported from `.tsx` files cause `TS7016 (no declaration file)`. The
  fix is a colocated `.d.ts` (see `src/api/base44Client.d.ts` typing the
  server-backed base44 client loosely — entity records are `any`, call shapes
  are accurate). Add similar `.d.ts` files for other JS modules a `.tsx` imports.
- `src/components/mockups/**` is excluded from typecheck: it's an orphaned scratch
  area, NOT wired to the mockup-sandbox artifact (that artifact loads mockups from
  its own `artifacts/mockup-sandbox/src/components/mockups/`).
