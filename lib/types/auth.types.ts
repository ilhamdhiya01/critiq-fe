export type Role = "ADMIN" | "REVIEWER" | "VIEWER";
export type Provider = "GITHUB" | "GITLAB";

export interface DecodedToken {
  sub: string;
  activeOrgId: string;
  role: Role;
  provider: Provider;
}
