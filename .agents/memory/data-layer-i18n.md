---
name: Data-layer i18n strings
description: Display strings built in src/data/* functions won't translate unless the translator is threaded in.
---

# Data-layer display strings must receive the translator

Some `src/data/*` builder functions (e.g. `getInsights` in `copilot.ts`) return
user-facing `title`/`text` strings. These bypass component-level `useTranslation`,
so they stayed German after a language switch even when the whole UI was otherwise
i18n'd.

**Rule:** when a data/builder function returns display copy, pass `t: TFunction`
(from `i18next`) into it and build every string via `t("key", { ...interpolation })`.
Keep enum/status comparisons against German literals in the data layer (they are
filtering logic, not display).

**Why:** the root cause of "still untranslated" reports is usually copy generated
outside React components, not a missing key.

**How to apply:** grep `src/data` for template literals / German words when insight,
summary, or label cards don't translate. Use `n` (not `count`) for numeric
interpolation params to avoid accidental i18next pluralization branching.
