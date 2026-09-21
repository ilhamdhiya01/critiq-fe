export type Role = "ADMIN" | "REVIEWER" | "VIEWER";
export type Provider = "GITHUB" | "GITLAB";

export interface DecodedToken {
  sub: string;
  activeOrgId: string | null;
  role: Role;
  provider: Provider;
  onboardingCompleted: boolean;
}
