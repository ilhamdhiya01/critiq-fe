const HOURS_PER_DAY = 24;

// "5.0 h" under a day, otherwise "1.8 d"; "—" without data.
export const formatMttr = (hours: number | null): string => {
  if (hours === null) return "—";
  return hours < HOURS_PER_DAY
    ? `${hours.toFixed(1)} h`
    : `${(hours / HOURS_PER_DAY).toFixed(1)} d`;
};

export type InsightsTrend =
  | {
      kind: "change";
      direction: "down" | "up";
      tone: "good" | "bad";
      text: string;
    }
  | { kind: "same" }
  | { kind: "new"; tone: "good" | "bad" };

// Fewer criticals is good. Never "∞%": a zero baseline reads as "new".
export const getPercentTrend = (
  current: number,
  previous: number,
): InsightsTrend | null => {
  if (previous === 0) return current > 0 ? { kind: "new", tone: "bad" } : null;
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { kind: "same" };
  return {
    kind: "change",
    direction: percent < 0 ? "down" : "up",
    tone: percent < 0 ? "good" : "bad",
    text: `${Math.abs(percent)}%`,
  };
};

// More resolved criticals is good, so the colours flip from "found". The
// change is a count ("↑ 3"), and a zero baseline reads as "new".
export const getResolvedTrend = (
  current: number,
  previous: number,
): InsightsTrend | null => {
  if (previous === 0) return current > 0 ? { kind: "new", tone: "good" } : null;
  const diff = current - previous;
  if (diff === 0) return { kind: "same" };
  return {
    kind: "change",
    direction: diff > 0 ? "up" : "down",
    tone: diff > 0 ? "good" : "bad",
    text: String(Math.abs(diff)),
  };
};

// Faster resolution is good; the change is shown in MTTR units.
export const getMttrTrend = (
  current: number | null,
  previous: number | null,
): InsightsTrend | null => {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return { kind: "same" };
  return {
    kind: "change",
    direction: diff < 0 ? "down" : "up",
    tone: diff < 0 ? "good" : "bad",
    text: formatMttr(Math.abs(diff)),
  };
};

// Width of each bar, relative to the largest count.
export const getBarPercents = (counts: readonly number[]): number[] => {
  const max = Math.max(0, ...counts);
  return counts.map((count) => (max > 0 ? (count / max) * 100 : 0));
};

const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const shortDate = (date: Date): string =>
  date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// Monday "2026-10-13" → "Oct 13 – Oct 19" (parsed as a local date so the
// week never shifts across time zones).
export const formatWeekRange = (weekStart: string): string => {
  const start = parseLocalDate(weekStart);
  const end = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
  );
  return `${shortDate(start)} – ${shortDate(end)}`;
};
