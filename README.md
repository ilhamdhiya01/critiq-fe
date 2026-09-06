# Critiq — AI-Assisted Code Review (Frontend)

Critiq is a multi-organization code review SaaS platform that scans pull/merge request **diffs only** (never the full codebase) on every push, flags Critical-severity findings, and lets reviewers choose a review mode per PR — **Manual** or **AI-Assisted**. The final decision (Approve / Request Changes) is always made by a human; AI never auto-approves or auto-merges.

Every customer company is one **Organization** — the owner of its connected repos, GitLab instance, members, branch policies, rules, AI provider, and audit log. Data is strictly isolated between organizations.

This repository (`critiq-fe`) contains the frontend web application for Critiq.

> Status: MVP v1.2 (Draft) · Multi-tenant SaaS · Internal · Cititex Engineering
>
> Note: the Organization/multi-tenancy model described below (§ Organizations & Multi-Tenancy, org-scoped API) is the target product direction from the PRD. It is **not yet implemented** in this codebase — `routes.ts` and `mocks/handlers.ts` are currently still single-tenant. Treat this document as the spec to build toward, not a description of current code.

---

## Overview

Critiq unifies pull requests from **GitHub (org)** and **GitLab (self-hosted)** into a single list per organization, applies branch-level review policies, and gives teams an audit trail over every review decision.

**MVP goals**

- Speed up review turnaround (target: AI-assisted ~3× faster than manual)
- Catch Critical issues (secrets, crashes, breaking changes, missing error handling, N+1 queries, failing CI) before they reach the main branch via a quality gate
- Give admins per-branch policy control (`Manual only` / `Allow AI` / `Require both`), with a full audit log of every decision and review mode used
- Absolute data isolation between organizations on one platform (multi-tenancy)

**Explicitly out of scope for MVP**

- Major / Minor / Info severity tiers (Critical-only for now)
- Full-codebase scanning, auto-fix, or auto-merge
- Code hosts other than GitHub and GitLab
- Billing, quotas, and per-organization subscription plans (post-MVP)

---

## Organizations & Multi-Tenancy

- **One account, many organizations.** A single OAuth identity (GitHub or GitLab) can be a member of multiple organizations, with a different role in each — switched via an org switcher (Slack/Linear/GitHub pattern). Since OAuth is the only login path, user identity is inherently singular; separate accounts per organization can't be enforced.
- **Self-serve organization creation.** A new user with no existing membership automatically gets a system-created Organization, becomes its Admin, and enters the onboarding wizard. Invite-only mode can be added later as a per-deployment flag without changing the data model.
- **Role lives on membership**, not on the user (`user_id × org_id × role`) — the same person can be Admin in one organization and Viewer in another.
- **Isolation is absolute** — no endpoint, query, or notification ever crosses organizations. Every mutation is recorded to that organization's own audit log.
- Organization slug is globally unique (used in `critiq.app/<slug>`); the display name doesn't have to be.
- Every organization must have at least one Admin — the last Admin can't be demoted or leave.

---

## Roles

Roles are per-organization membership, not global — the same user can hold different roles in different organizations.

| Role         | Example      | Permissions (within that organization)                                                                                                     |
| ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Admin**    | Tech Lead    | Everything a Reviewer can do, plus: connect/disconnect repos, manage branch policy, rules, AI provider, and members (invite & change role) |
| **Reviewer** | Engineers    | Review PRs (choose mode), approve / request changes, comment                                                                               |
| **Viewer**   | Stakeholders | Read-only: dashboard, insights, activity                                                                                                   |

---

## Product Areas

| Screen            | Main content                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Login             | Split layout: auth column (logo, Continue with GitHub / GitLab, ToS) + brand panel; brand panel hidden below `900px`                                   |
| Onboarding Wizard | 4 steps: code host → organization (name + slug) → select repos → default branch policy; post-login flow starts at step 2                               |
| Org Switcher      | Sidebar control: active org avatar + name + role; dropdown of all orgs the user belongs to + "New organization"                                        |
| Dashboard         | KPIs, monitored repos table (re-scan/disconnect), active Critical issues, 30-day review stats, recent activity — all scoped to the active organization |
| Pull Requests     | Unified GitHub PR + GitLab MR list; status filters; gate/critical/mode/policy columns                                                                  |
| PR Detail         | Header, mode selector / policy banner, AI Summary, flagged issues, diff viewer with inline comments, decision bar (read-only for Viewer), discussion   |
| Repositories      | Repo cards (rating, gate, critical count) + Connect Repository (Admin only)                                                                            |
| Repo Detail       | Repo stats, PR list, branch protection settings, scan history                                                                                          |
| Rules & Profiles  | 6 toggleable Critical rules; Major/Minor/Info tiers locked (coming soon)                                                                               |
| Activity          | Audit log timeline per organization, filter by decision × mode, grouped by day                                                                         |
| Insights          | 8-week Critical issue trend, AI vs Manual comparison, acceptance rate                                                                                  |
| Settings          | Organization card (name, URL, role, members), AI provider, GitHub/GitLab integrations, notifications, Members (invite + change role)                   |

Global elements: collapsible sidebar (auto-collapses below `1100px`, org switcher shrinks to avatar-only), top bar with global search (`⌘K`, scoped to the active organization), notifications, and profile menu.

---

## Core Business Rules

- **Human-in-the-loop is absolute** — Approve/Request Changes can only be performed by a human, in every review mode.
- **Diff-only scanning** — one scan per PR push; Critiq never reads the full codebase.
- **Quality gate** = `PASSED` when there are 0 active Critical findings on enabled rules and CI is green; `FAILED` otherwise.
- **Policy precedence** — branch policy (`Manual only` / `Require both`) overrides the reviewer's personal mode preference. A `branch/*` pattern applies to all branches with that prefix.
- **Audit** — every decision is logged per organization with reviewer, role, review mode, PR, and timestamp.
- **Repo quality rating (A/B/C)** — draft definition: A = 0 active Critical & gate PASSED · B = 1 active Critical or gate recently recovered · C = ≥2 active Critical / repeated gate FAILED. Final formula pending validation with engineering.
- **Organization isolation is absolute** — no cross-organization query, listing, or notification, ever.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Package manager:** pnpm
- **Styling:** Tailwind CSS v4 (CSS-first, token-based) + `tailwind-variants` for component variants
- **Data fetching / cache:** TanStack Query
- **Client state:** Zustand (auth/session only — server state never lives in Zustand)
- **Forms:** react-hook-form + Zod
- **Auth:** OAuth (GitHub / GitLab) only — login is signup, no email/password in MVP
- **API mocking (dev):** MSW, persisted to IndexedDB

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 22.12 — check with `node -v`
- **pnpm** — check with `pnpm -v`, install via `corepack enable` or `npm install -g pnpm`

### Install & Run

```bash
git clone <repo-url> critiq-fe
cd critiq-fe
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm dev
```

The app runs at `http://localhost:3000` by default.

### Other scripts

```bash
pnpm build      # production build
pnpm start      # run the production build locally
pnpm lint       # lint the codebase
pnpm test       # run the test suite
pnpm format     # prettier
```

### Environment Variables

| Variable                             | Description                                                     |
| ------------------------------------ | --------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                | Base URL of the Critiq API (e.g. `https://api.critiq.internal`) |
| `NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth app client ID, used for `Continue with GitHub`     |
| `NEXT_PUBLIC_GITLAB_OAUTH_CLIENT_ID` | GitLab OAuth app client ID, used for `Continue with GitLab`     |

> Backend service is a separate repo — coordinate with the API team for actual values. In development, most endpoints are simulated with MSW.

---

## API Integration

The backend exposes a REST + JSON API, authenticated via Bearer token. **Every endpoint is scoped to an organization** under `/api/v1/orgs/:orgId/...`, except auth/session and the inbound webhooks, which are global. Role is evaluated from the caller's membership on `:orgId` (`403` if not a member or role is insufficient). Every mutation is recorded to that organization's audit log.

Key endpoint groups the frontend consumes:

| Group                   | Examples                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth & session (global) | `POST /auth/oauth/:provider`, `POST /auth/logout`, `GET /me`                                                                                         |
| Organizations & members | `GET /me/orgs`, `POST /orgs`, `PATCH /orgs/:orgId`, `GET /orgs/:orgId/members`, `POST /orgs/:orgId/invites`, `PUT /orgs/:orgId/members/:userId/role` |
| Dashboard               | `GET …/dashboard/summary`                                                                                                                            |
| Repositories            | `GET/POST/DELETE …/repos`, `GET/PUT …/repos/:id/protection`, `POST …/repos/:id/rescan`                                                               |
| Pull Requests           | `GET …/pulls`, `GET …/pulls/:id`, `GET …/pulls/:id/diff`, `PUT …/pulls/:id/mode`, `POST …/pulls/:id/review`                                          |
| Comments                | `GET/POST …/pulls/:id/comments`                                                                                                                      |
| Rules                   | `GET/PUT …/rules`                                                                                                                                    |
| Activity & Insights     | `GET …/activity`, `GET …/insights`                                                                                                                   |
| Settings & integrations | `GET/PUT …/settings/provider`, `GET/PUT …/settings/notifications`, `POST …/integrations/gitlab`, `GET …/integrations`                                |
| Search & notifications  | `GET …/search?q=`, `GET …/notifications`, `POST …/notifications/read`                                                                                |
| Webhooks (global)       | `POST /webhooks/github`, `POST /webhooks/gitlab`                                                                                                     |

> `GET /team` / `PUT /team/:id/role` are deprecated as of PRD v1.2 — replaced by the members endpoints above.

Full request/response contracts live in the product PRD — treat that as the source of truth and avoid duplicating full payload shapes here as the API evolves.

---

## Design System

The visual language is a dark, mono-accented UI (base `#0A0A0A`, indigo accent `#6366F1` for AI-related elements and the Admin role badge, semantic colors for gate/status states). Typography mixes system sans for UI text with **JetBrains Mono** for data, KPIs, panel headers, role badges, and the `CRITIQ` wordmark.

Full design tokens (colors, type scale, spacing, radii, breakpoints, and per-component states like buttons, pills, org switcher, diff viewer, modals) are defined in the product design spec — mirror them into `app/globals.css` (`:root` + `@theme inline`) rather than hardcoding values across components. This project does not use `tailwind.config.js` (Tailwind v4 is CSS-first).

Key breakpoints to design against:

- `<1280px` — search bar narrows, repo grid → 2 columns
- `<1180px` — dashboard → 1 column
- `<1100px` — sidebar auto-collapses (org switcher shrinks to avatar-only)
- `<960px` — KPIs → 2 columns
- `<900px` — repo grid → 1 column, login brand panel hidden

---

## Folder Structure

Source lives at the repo root (no `src/`), imported via the `@/` alias.

```
critiq-fe/
├── app/
│   ├── (auth)/login/
│   └── (dashboard)/
│       └── repositories/
├── components/
│   ├── ui/            # primitives — button, icon, ...
│   ├── shared/         # reusable across features — logo, state-status, ...
│   ├── features/       # domain-specific — auth, repositories, ...
│   └── providers/      # context / providers
├── lib/
│   ├── hooks/<domain>/ # query & mutation hooks
│   ├── hooks/          # utility hooks (e.g. useDebounce)
│   ├── types/           # TypeScript types
│   └── helpers/
├── services/            # API-calling functions per domain
├── schemas/             # Zod schemas
├── stores/              # Zustand stores
├── const/               # constants
├── mocks/               # MSW handlers (dev-only API simulation)
├── routes.ts            # app paths & API endpoints
└── proxy.ts             # middleware (Next 16 convention)
```

---

## Contributing

Since Critiq is itself a code review tool, it dogfoods its own flow:

1. Branch from `main`, prefix with `feat/`, `fix/`, or `chore/`
2. Open a PR — Critiq's own quality gate and review mode apply once the backend is live
3. At least one human Approve is required regardless of AI-Assisted findings
4. Keep PRs scoped to a single screen/flow where possible, matching the Product Areas above

---

## Known Open Questions

Carried over from the product PRD — flag these if they affect frontend states/UX:

- Behavior when the AI provider is down: silent fallback to Manual mode, or block AI mode entirely?
- Diff size limit for AI analysis, and how the diff viewer should represent truncated/oversized diffs
- Whether inline comments sync back to GitHub/GitLab as native review comments
- Audit log retention and export requirements (CSV/SIEM)
- Repo quality rating (A/B/C) formula validation against historical data
- Personal API token permission scope (read-only vs full) and expiry
- Organization slug changes: redirect from old slug, or immutable?
- Organization ownership transfer and deletion (data retention, grace period)
- Can one GitHub org be connected to two different Critiq organizations, or is it exclusive?
- Per-user organization limits on the free tier; SSO enforcement / domain claim per organization (enterprise)
- Invitation expiry, re-send behavior, and whether it can force a specific OAuth provider

---

## License

Internal — Cititex Engineering. Not for external distribution.
