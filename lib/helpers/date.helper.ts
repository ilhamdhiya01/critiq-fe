export const formatRelativeTime = (isoString: string): string => {
  const diffMs = Math.max(0, Date.now() - new Date(isoString).getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} h ago`;
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
};

// Whole days until a future date, rounded up; negative once it has passed.
export const getDaysUntil = (isoString: string, now = Date.now()): number =>
  Math.ceil((new Date(isoString).getTime() - now) / (24 * 60 * 60 * 1000));

export const formatDate = (isoString: string): string =>
  new Date(isoString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const formatDateTime = (isoString: string): string =>
  new Date(isoString).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
