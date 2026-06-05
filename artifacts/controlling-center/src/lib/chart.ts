// Shared chart palette derived from the LPO brand tokens (navy + teal) in
// `index.css` (--primary / --brass / --chart-*). Recharts needs literal color
// strings rather than CSS vars, so these mirror the design tokens to keep every
// chart in the app on one cohesive, readable palette.
export const CHART = {
  navy: "hsl(216 60% 16%)",
  teal: "hsl(190 80% 42%)",
  blue: "hsl(217 80% 58%)",
  amber: "hsl(38 92% 52%)",
  emerald: "hsl(160 70% 42%)",
  red: "hsl(0 72% 51%)",
  grey: "hsl(215 16% 47%)",
  // Subtle grid / axis lines (matches the --border token).
  grid: "hsl(214 32% 91%)",
} as const;

// Ordered categorical palette for multi-series charts (lines, bars, areas).
export const CHART_SERIES = [
  CHART.navy,
  CHART.teal,
  CHART.blue,
  CHART.amber,
  CHART.emerald,
  CHART.grey,
] as const;

// Palette for pie / share charts — leads with the teal accent for emphasis,
// then alternates hues for clear separation between adjacent slices.
export const PIE_COLORS = [
  CHART.teal,
  CHART.navy,
  CHART.blue,
  CHART.amber,
  CHART.emerald,
  CHART.grey,
] as const;
