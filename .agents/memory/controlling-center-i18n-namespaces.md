---
name: Controlling Center i18n namespaces
description: How the split-namespace i18n is wired so flat t("key") call sites keep working
---

The i18n resources are split into per-domain modules under
`src/i18n/namespaces/*.ts`, each exporting `de`/`en`/`es` partial dicts. They are
assembled in `src/i18n/index.ts` into real i18next namespaces.

**Rule:** call sites still use the flat form `t("key")` — keys are globally
unique across namespaces. This works because `defaultNS: "common"` plus
`fallbackNS` = every other namespace, so i18next searches all namespaces.

**Why:** the original was one 3000+ line flat block (unmaintainable). Splitting
without rewriting thousands of `t("key")` calls required globally-unique keys +
fallbackNS rather than `t("ns:key")`.

**How to apply:**
- Add a key → put it in the right namespace module in ALL THREE languages, and
  keep the key globally unique (a duplicate key in two namespaces resolves to
  whichever namespace is searched first).
- Register a NEW namespace by importing it and adding it to the `NAMESPACES` map
  in `index.ts` (fallbackNS is derived automatically).
- Never put `.` or `:` in a key (they are i18next key/ns separators).
- `pnpm --filter @workspace/controlling-center run i18n:check` flags keys missing
  in any of de/en/es (fails CI) and lists likely-unused keys (warning only —
  many are referenced dynamically via i18n/labels.ts maps, so false positives).
