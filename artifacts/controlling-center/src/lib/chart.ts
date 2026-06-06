// Shared chart palette derived from the LPO brand tokens (Navy / White / Gold)
// in `index.css` (--primary / --brass / --chart-*). Recharts needs literal color
// strings rather than CSS vars, so these mirror the design tokens to keep every
// chart in the app on one cohesive, readable palette: Navy · Gold · Teal · Purple · Pink.
export const CHART = {
  navy: "hsl(214 52% 24%)",
  gold: "hsl(43 65% 56%)",
  teal: "hsl(160 60% 45%)",
  purple: "hsl(280 65% 60%)",
  pink: "hsl(340 75% 55%)",
  blue: "hsl(217 80% 58%)",
  amber: "hsl(38 92% 52%)",
  emerald: "hsl(160 70% 42%)",
  red: "hsl(0 72% 51%)",
  grey: "hsl(214 20% 50%)",
  // Subtle grid / axis lines (matches the --border token).
  grid: "hsl(214 20% 90%)",
} as const;

// Ordered categorical palette for multi-series charts (lines, bars, areas).
export const CHART_SERIES = [
  CHART.navy,
  CHART.gold,
  CHART.teal,
  CHART.purple,
  CHART.pink,
  CHART.grey,
] as const;

// Palette for pie / share charts — leads with navy, then the gold accent, then
// alternating hues for clear separation between adjacent slices.
export const PIE_COLORS = [
  CHART.navy,
  CHART.gold,
  CHART.teal,
  CHART.purple,
  CHART.pink,
  CHART.grey,
] as const;
