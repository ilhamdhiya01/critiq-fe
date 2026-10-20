export interface ChartPoint {
  x: number;
  y: number;
}

// Smallest "nice" step (1, 2 or 5 × 10ⁿ) that is ≥ the raw step.
const niceStep = (raw: number): number => {
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
};

// Y axis with 3–4 gridlines (e.g. 14 → 0/5/10/15). Counts are whole numbers,
// so the axis never goes below 0–3: small or all-zero series keep integer
// ticks and the flat line has room.
export const getNiceScale = (
  maxValue: number,
): { max: number; step: number; ticks: number[] } => {
  const target = Math.max(maxValue, 3);
  const step = niceStep(target / 3);
  const max = Math.ceil(target / step) * step;
  const ticks = Array.from(
    { length: Math.round(max / step) + 1 },
    (_, index) => index * step,
  );
  return { max, step, ticks };
};

// Data → pixel coordinates inside the plot box (y grows downwards).
export const getPoints = (
  values: readonly number[],
  { width, height, max }: { width: number; height: number; max: number },
): ChartPoint[] => {
  const span = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((value, index) => ({
    x: values.length > 1 ? index * span : width / 2,
    y: height - (max > 0 ? (value / max) * height : 0),
  }));
};

export const toLinePath = (points: readonly ChartPoint[]): string =>
  points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

// Closes the line down to the baseline so it can be filled.
export const toAreaPath = (
  points: readonly ChartPoint[],
  baselineY: number,
): string => {
  if (points.length === 0) return "";
  const first = points[0];
  const last = points[points.length - 1];
  return `${toLinePath(points)} L${last.x},${baselineY} L${first.x},${baselineY} Z`;
};
