// Shape checks for ids that arrive through the URL. They gate a request
// before it is built, so a crafted link shows a 404 instead of reaching the
// API at all (routes.ts also encodes every segment).

// Prisma cuid() (v1): "c" + 24 lowercase alphanumerics.
const CUID = /^c[a-z0-9]{24}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// The BE issues invite tokens as randomBytes(32) in base64url: 43 chars.
const INVITE_TOKEN = /^[A-Za-z0-9_-]{43}$/;

export const isResourceId = (value: string | null | undefined): boolean =>
  !!value && (CUID.test(value) || UUID.test(value));

export const isInviteToken = (value: string | null | undefined): boolean =>
  !!value && INVITE_TOKEN.test(value);
