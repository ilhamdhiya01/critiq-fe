export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdBy: string;
  // From GET /me/orgs; the source of truth per org (the token only knows the
  // org that was active when it was issued).
  onboardingCompleted: boolean;
}
