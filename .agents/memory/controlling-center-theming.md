---
name: Controlling Center theming
description: How the controlling-center app's accent color is wired, and how to sweep for stray color literals.
---

# Controlling Center theming

The app (`artifacts/controlling-center`) is themed through CSS variables in `src/index.css`. The legacy accent was called "brass" (gold). The brand accent is now **teal** but the code still uses the name `brass` everywhere.

**Key wiring:** a single `--brass` HSL var in `:root`/`.dark` plus `--color-brass: hsl(var(--brass))` in the `@theme inline` block drives ALL accent usage — both the custom classes (`.brass-gradient`, `.brass-ring`, `.nav-item-active`) and the Tailwind-generated utilities (`text-brass`, `bg-brass/10`, `ring-brass/30`, `decoration-brass/70`). To re-tint the whole accent, change `--brass` only; do NOT reintroduce a custom `.text-brass` class (it conflicts with the generated utility).

**Why:** charts also hardcode a `const BRASS = "hsl(...)"` in `Dashboard/Finanzen/Prognosen/Entitaeten.tsx` (Recharts needs literal strings, not CSS vars), so those must be edited separately from the token.

**How to apply — color-literal sweep gotcha:** when hunting stray gold/old-color literals, search for ALL spacing variants, not just one:
- spaced HSL: `hsl(40 48% 56%)`
- underscore HSL (Tailwind arbitrary values like `ring-[hsl(40_48%_56%)]`): `hsl(40_48%`
- no-space rgba (inline styles): `rgba(199,161,90`
A single-format grep missed literals in `Term.tsx` (inline `rgba(...)`) and `Entitaeten.tsx` (underscore arbitrary values).
