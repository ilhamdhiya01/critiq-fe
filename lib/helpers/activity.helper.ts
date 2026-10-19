import type { ReviewActivityItem } from "@/lib/types/activity.types";

export interface ActivityGroup {
  key: string;
  label: string;
  items: ReviewActivityItem[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Midnight in the browser's time zone, built from local date parts so DST
// shifts don't move the day boundary.
const startOfLocalDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getDayLabel = (daysAgo: number, day: Date): string => {
  if (daysAgo <= 0) return "TODAY";
  if (daysAgo === 1) return "YESTERDAY";
  if (daysAgo < 7) return "EARLIER THIS WEEK";
  return day
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

// Groups newest-first items by day. Call it on all loaded pages together so
// a day split across a page boundary stays one group.
export const groupActivityByDay = (
  items: readonly ReviewActivityItem[],
  now: Date = new Date(),
): ActivityGroup[] => {
  const today = startOfLocalDay(now);
  const groups: ActivityGroup[] = [];

  for (const item of items) {
    const day = startOfLocalDay(new Date(item.createdAt));
    const daysAgo = Math.round((today.getTime() - day.getTime()) / DAY_MS);
    const label = getDayLabel(daysAgo, day);
    const last = groups[groups.length - 1];

    if (last?.label === label) {
      last.items.push(item);
    } else {
      groups.push({ key: `${label}-${item.id}`, label, items: [item] });
    }
  }

  return groups;
};
