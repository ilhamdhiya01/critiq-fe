# Critiq — AI-Assisted Code Review (Frontend)

Critiq is a code review platform that scans pull/merge request **diffs only** (never the full codebase) on every push, flags Critical-severity findings, and lets reviewers choose a review mode per PR — **Manual** or **AI-Assisted**. The final decision (Approve / Request Changes) is always made by a human; AI never auto-approves or auto-merges.

This repository (`critiq-fe`) contains the frontend web application for Critiq.

> Status: MVP v1.0 (Draft) · Internal · Cititex Engineering

---

## Overview

Critiq unifies pull requests from **GitHub (org)** and **GitLab (self-hosted)** into a single list, applies branch-level review policies, and gives teams an audit trail over every review decision.

**MVP goals**

- Speed up review turnaround (target: AI-assisted ~3× faster than manual)
- Catch Critical issues (secrets, crashes, breaking changes, missing error handling, N+1 queries, failing CI) before they reach the main branch via a quality gate
- Give admins per-branch policy control (`Manual only` / `Allow AI` / `Require both`), with a full audit log of every decision and review mode used

**Explicitly out of scope for MVP**

- Major / Minor / Info severity tiers (Critical-only for now)
- Full-codebase scanning, auto-fix, or auto-merge
- Code hosts other than GitHub and GitLab

---

## Roles

| Role         | Example      | Permissions                                                                                                      |
| ------------ | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Admin**    | Tech Lead    | Everything a Reviewer can do, plus: connect/disconnect repos, manage branch policy, rules, AI provider, and team |
| **Reviewer** | Engineers    | Review PRs (choose mode), approve / request changes, comment                                                     |
| **Viewer**   | Stakeholders | Read-only: dashboard, insights, activity                                                                         |

---

## Product Areas

| Screen            | Main content                                                                                                                  |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Onboarding Wizard | 3 steps: code host → select repos → default branch policy                                                                     |
| Dashboard         | KPIs, monitored repos table (re-scan/disconnect), active Critical issues, 30-day review stats, recent activity                |
| Pull Requests     | Unified GitHub PR + GitLab MR list; status filters; gate/critical/mode/policy columns                                         |
| PR Detail         | Header, mode selector / policy banner, AI Summary, flagged issues, diff viewer with inline comments, decision bar, discussion |
| Repositories      | Repo cards (rating, gate, critical count) + Connect Repository                                                                |
| Repo Detail       | Repo stats, PR list, branch protection settings, scan history                                                                 |
| Rules & Profiles  | 6 toggleable Critical rules; Major/Minor/Info tiers locked (coming soon)                                                      |
| Activity          | Audit log timeline, filter by decision × mode, grouped by day                                                                 |
| Insights          | 8-week Critical issue trend, AI vs Manual comparison, acceptance rate                                                         |
| Settings          | AI provider/model/API key, GitHub/GitLab integrations, notifications, team management                                         |

Global elements: collapsible sidebar (auto-collapses below 1100px), top bar with global search (`⌘K`), notifications, and profile menu.

---

## Core Business Rules

- **Human-in-the-loop is absolute** — Approve/Request Changes can only be performed by a human, in every review mode.
- **Diff-only scanning** — one scan per PR push; Critiq never reads the full codebase.
- **Quality gate** = `PASSED` when there are 0 active Critical findings on enabled rules and CI is green; `FAILED` otherwise.
- **Policy precedence** — branch policy (`Manual only` / `Require both`) overrides the reviewer's personal mode preference. A `branch/*` pattern applies to all branches with that prefix.
- **Audit** — every decision is logged with reviewer, review mode, PR, and timestamp.
- **Repo quality rating (A/B/C)** — draft definition: A = 0 active Critical & gate PASSED · B = 1 active Critical or gate recently recovered · C = ≥2 active Critical / repeated gate FAILED. Final formula pending validation with engineering.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS is recommended — the design spec (see `Design System` below) is fully token-based (colors, spacing, radius, type scale), which maps cleanly onto a Tailwind config
- **Data fetching / cache:** TanStack Query (React Query) or SWR — suggested, not finalized
- **Auth:** OAuth (GitHub/GitLab) + email/password, session-based

> Adjust this section once stack decisions (styling, data layer, testing) are finalized by the team.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.x (LTS) — check with `node -v`
- **pnpm** ≥ 9.x — check with `pnpm -v`, install via `corepack enable` or `npm install -g pnpm`

> Pin the exact Node version in an `.nvmrc` (e.g. `20.18.0`) once decided, so `nvm use` / CI stay in sync.

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
pnpm lint        # lint the codebase
```

### Environment Variables

| Variable                             | Description                                                     |
| ------------------------------------ | --------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`           | Base URL of the Critiq API (e.g. `https://api.critiq.internal`) |
| `NEXT_PUBLIC_API_VERSION`            | API version prefix, currently `v1` (`/api/v1`)                  |
| `NEXT_PUBLIC_GITHUB_OAUTH_CLIENT_ID` | GitHub OAuth app client ID, used for `Continue with GitHub`     |
| `NEXT_PUBLIC_GITLAB_OAUTH_CLIENT_ID` | GitLab OAuth app client ID, used for `Continue with GitLab`     |

> Backend service is a separate repo — coordinate with the API team for actual values.

---

## API Integration

The backend exposes a REST + JSON API at `/api/v1`, authenticated via Bearer token. All mutations are recorded to the audit log server-side.

Key endpoint groups the frontend consumes:

| Group               | Examples                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| Auth & session      | `POST /auth/oauth/:provider`, `POST /auth/login`, `POST /auth/logout`                                  |
| Dashboard           | `GET /dashboard/summary`                                                                               |
| Repositories        | `GET/POST/DELETE /repos`, `GET/PUT /repos/:id/protection`, `POST /repos/:id/rescan`                    |
| Pull Requests       | `GET /pulls`, `GET /pulls/:id`, `GET /pulls/:id/diff`, `PUT /pulls/:id/mode`, `POST /pulls/:id/review` |
| Comments            | `GET/POST /pulls/:id/comments`                                                                         |
| Rules               | `GET/PUT /rules`                                                                                       |
| Activity & Insights | `GET /activity`, `GET /insights`                                                                       |
| Settings            | `GET/PUT /settings/provider`, `POST /integrations/gitlab`, `GET/PUT /team/:id/role`                    |
| Search              | `GET /search?q=` (powers `⌘K`)                                                                         |

Full request/response contracts live in the product PRD — treat that as the source of truth and avoid duplicating full payload shapes here as the API evolves.

---

## Design System

The visual language is a dark, mono-accented UI (base `#0A0A0A`, indigo accent `#6366F1` for AI-related elements, semantic colors for gate/status states). Typography mixes system sans for UI text with **JetBrains Mono** for data, KPIs, and panel headers.

Full design tokens (colors, type scale, spacing, radii, breakpoints, and per-component states like buttons, pills, diff viewer, modals) are defined in the product design spec — mirror them into `tailwind.config.ts` / a `tokens.css` file rather than hardcoding values across components, so token changes stay in one place.

Key breakpoints to design against:

- `<1280px` — search bar narrows, repo grid → 2 columns
- `<1180px` — dashboard → 1 column
- `<1100px` — sidebar auto-collapses
- `<960px` — KPIs → 2 columns, insights → 1 column
- `<900px` — repo grid → 1 column

---

## Suggested Folder Structure

```
critiq-fe/
├── app/
│   ├── (auth)/login/
│   ├── (onboarding)/setup/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── pull-requests/[id]/
│   │   ├── repositories/[id]/
│   │   ├── rules/
│   │   ├── activity/
│   │   ├── insights/
│   │   └── settings/
├── components/
│   ├── diff-viewer/
│   ├── pr-list/
│   ├── status-pill/
│   └── ...
├── lib/
│   ├── api/            # API client, typed fetchers per endpoint group
│   └── auth/
├── styles/
│   └── tokens.css       # or tailwind.config.ts theme extension
└── .env.example
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

---

## License

Internal — Cititex Engineering. Not for external distribution.
