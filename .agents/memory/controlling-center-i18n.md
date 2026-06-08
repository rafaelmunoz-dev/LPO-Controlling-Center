---
name: Controlling Center i18n completeness
description: How to fully translate the LPO Controlling Center (de/en/es) without leaving German leaks; what stays German on purpose.
---

# Controlling Center i18n completeness

The app stores German enum/domain values directly in state and data constants and renders
them verbatim. Switching language only translates everything if EVERY such render is routed
through a `t()`-based label map (German value → key, rendered `t(MAP[v] ?? v)`). Nav-only
translation is not enough.

**Why:** German literals are scattered far beyond nav — selects, badges, tables, chart
legend `name=` props, tooltip `title=` attrs, input placeholders, and the global Topbar
period selector are each independent leaks that have surfaced in review rounds.

**How to apply — when adding/translating any UI:**
- Build a `Record<germanValue, key>` map per enum and render through `t()`; keys must match the source constant's values exactly.
- Radix `SelectValue` re-renders the selected item's translated children, so translating the SelectItem covers the trigger too — don't double-render.
- Every key MUST exist in all three dicts (`en/es: typeof de`); after edits verify equal key counts across de/en/es and that `tsc -b` is clean.

**Intentionally left German (do NOT "fix"):** domain data stored in state (entity/employee
names, role/job-title values), status tone-map styling keys used only for className lookup
(not display), shadcn ui/ internals, language-menu native names, and locale-neutral periods
like "Q2 2026".

**Judgment call — on-screen content wins over "exports stay German":** when one string feeds
BOTH an on-screen preview and a generated PDF/CSV (e.g. the report AI summary), translate it —
the visible-UI requirement takes precedence, and the export reflecting the chosen language is
acceptable. Only force a German source string when content is export-only.

**Two distinct translation layers — use the right one:**
- Finite enums → `labels.ts` maps (`tLabel`/`tFinanceLabel`/`statusLabel`/`riskLabel`), German value → i18n key.
- Free-text mock/domain prose (risk/strategy/premortem titles+narrative, PR titles/justifications, approval subjects/reasons/risks, notes, entity descriptions, MS-adapter descriptions, form respondents/values) → `i18n/content.ts` `CONTENT` map (German source string → `{en,es}`) via `tContent(value)`. `tContent` reads the `i18n` singleton language: de=verbatim, en/es=mapped, **fallback=raw** so user-entered content and proper nouns (person/company/product/city names) pass through untranslated and never leak.
- Form-field values compose both: `tContent(tLabel(t, f.value))` — labels first, then content fallback.
- Bank suggestionReason is generated at runtime in German (incl. one with an interpolated vendor label); map at render with `tSuggestionReason(t, reason)` via `beleg_reason_heuristic` / `beleg_reason_learned` ({{label}}). Never touch the data layer.

**Verification that actually catches leaks:** statically extract every German string literal from `data/*.ts` and assert each is a key in `content.ts` OR `labels.ts` (or an intentional proper noun). tsc-clean + equal key counts alone will NOT catch a render site that forgot its `tContent`/`tLabel` wrap, or a CONTENT key whose text doesn't byte-match the source string.

**Still German on purpose (≥95% target):** bank CSV parse/validation error messages, upload filenames containing month names. Both edge-case, data-layer-coupled.
