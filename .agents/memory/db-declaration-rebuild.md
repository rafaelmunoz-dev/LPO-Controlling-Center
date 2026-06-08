---
name: DB declaration rebuild
description: Stale lib/db .d.ts files break the api-server typecheck after schema edits
---
`lib/db` is a TypeScript composite project with `emitDeclarationOnly: true` and `outDir: dist`. Consumers (e.g. `artifacts/api-server`) import `@workspace/db` resolving to `lib/db/dist/*.d.ts`, NOT the source.

**Symptom:** After `src/schema/domain.ts` (DOMAIN_TABLES / DomainKind) gains new keys, `artifacts/api-server` typecheck fails with TS2322 like `Type '"risks"' is not assignable to type '...8 original keys...'`, even though the source is correct. The dist declarations are stale.

**Fix:** `pnpm exec tsc -b lib/db --force` from the repo root to regenerate the declarations, then re-typecheck.

**Why:** The dev workflow uses esbuild (no typecheck) so runtime works fine while the committed dist `.d.ts` drifts behind source. There is no `build` script on the db package — it's built via `tsc -b` project references from the root tsconfig.

**How to apply:** Any time you edit `lib/db/src/**` and then run/trust a typecheck of a package that imports `@workspace/db`, rebuild the db declarations first.
