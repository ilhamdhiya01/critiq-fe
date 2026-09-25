const AVATAR_COLORS = [
  "bg-primary-900",
  "bg-success/20",
  "bg-warning/20",
  "bg-info/20",
  "bg-danger/20",
];

export const getAvatarColor = (username: string): string => {
  const hash = username
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

export const getInitials = (username: string): string =>
  username.slice(0, 2).toUpperCase();
