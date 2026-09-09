export type Role = "ADMIN" | "REVIEWER" | "VIEWER";

export interface DecodedToken {
  sub: string;
  activeOrgId: string;
  role: Role;
}
