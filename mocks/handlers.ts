import { delay, http, HttpResponse } from "msw";

import { dbOps } from "@/lib/index-db";
import type {
  ConnectRepositoryInput,
  Repository,
  ScanHistoryEntry,
} from "@/lib/types/repository.types";

const SEED_REPOS: Repository[] = [
  {
    id: "critiq-core",
    name: "critiq-core",
    source: "github",
    language: "TypeScript",
    qualityRating: "B",
    qualityGate: "PASSED",
    criticalCount: 0,
    defaultBranch: "main",
    lastScanAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    scanStatus: "idle",
  },
  {
    id: "payments-api",
    name: "payments-api",
    source: "github",
    language: "Go",
    qualityRating: "C",
    qualityGate: "FAILED",
    criticalCount: 4,
    defaultBranch: "main",
    lastScanAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    scanStatus: "idle",
  },
  {
    id: "web-console",
    name: "web-console",
    source: "github",
    language: "TypeScript",
    qualityRating: "A",
    qualityGate: "PASSED",
    criticalCount: 0,
    defaultBranch: "main",
    lastScanAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    scanStatus: "idle",
  },
  {
    id: "infra-terraform",
    name: "infra-terraform",
    source: "github",
    language: "HCL",
    qualityRating: "B",
    qualityGate: "PASSED",
    criticalCount: 0,
    defaultBranch: "main",
    lastScanAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    scanStatus: "idle",
  },
  {
    id: "mobile-sdk",
    name: "mobile-sdk",
    source: "github",
    language: "Kotlin",
    qualityRating: "A",
    qualityGate: "PASSED",
    criticalCount: 0,
    defaultBranch: "main",
    lastScanAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    scanStatus: "idle",
  },
  {
    id: "data-pipeline",
    name: "data-pipeline",
    source: "gitlab",
    language: "Python",
    qualityRating: "B",
    qualityGate: "PASSED",
    criticalCount: 2,
    defaultBranch: "main",
    lastScanAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    scanStatus: "idle",
  },
];

const SEED_SCANS: Record<string, ScanHistoryEntry[]> = {
  "payments-api": [
    {
      id: "payments-api-482",
      status: "FAILED",
      criticalCount: 4,
      pullRequestNumber: 482,
      scannedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    },
    {
      id: "payments-api-480",
      status: "PASSED",
      criticalCount: 0,
      pullRequestNumber: 480,
      scannedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

let seeded = false;

const ensureSeeded = async () => {
  if (seeded) return;
  seeded = true;

  const existing = await dbOps.getAll<Repository>("repos");
  if (existing.length > 0) return;

  for (const repo of SEED_REPOS) {
    await dbOps.put("repos", repo);
  }
  for (const [repoId, scans] of Object.entries(SEED_SCANS)) {
    for (const scan of scans) {
      await dbOps.put("repo-scans", { ...scan, repoId });
    }
  }
};

const isAuthorized = (request: Request) =>
  request.headers.get("Authorization")?.startsWith("Bearer ") ?? false;

const randomScanResult = () => {
  const critical = Math.random() > 0.6 ? Math.floor(Math.random() * 3) + 1 : 0;
  return {
    qualityGate: critical === 0 ? ("PASSED" as const) : ("FAILED" as const),
    criticalCount: critical,
  };
};

export const handlers = [
  http.get("*/repos", async () => {
    await ensureSeeded();
    const repos = await dbOps.getAll<Repository>("repos");
    return HttpResponse.json({ data: repos });
  }),

  http.get("*/repos/:id", async ({ params }) => {
    await ensureSeeded();
    const repo = await dbOps.get<Repository>("repos", String(params.id));
    if (!repo) {
      return HttpResponse.json(
        { message: "Repository not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({ data: repo });
  }),

  http.get("*/repos/:id/scans", async ({ params }) => {
    await ensureSeeded();
    const scans = await dbOps.getAll<ScanHistoryEntry & { repoId: string }>(
      "repo-scans",
    );
    const filtered = scans.filter((scan) => scan.repoId === params.id);
    return HttpResponse.json({ data: filtered });
  }),

  http.post("*/repos", async ({ request }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureSeeded();
    const input = (await request.json()) as ConnectRepositoryInput;
    const repo: Repository = {
      id: input.name,
      name: input.name,
      source: input.source,
      language: "Unknown",
      qualityRating: "A",
      qualityGate: null,
      criticalCount: 0,
      defaultBranch: "main",
      lastScanAt: null,
      scanStatus: "idle",
    };

    await dbOps.put("repos", repo);
    return HttpResponse.json({ data: repo }, { status: 201 });
  }),

  http.delete("*/repos/:id", async ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureSeeded();
    await dbOps.delete("repos", String(params.id));
    return HttpResponse.json({ data: null });
  }),

  http.post("*/repos/:id/rescan", async ({ request, params }) => {
    if (!isAuthorized(request)) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureSeeded();
    const id = String(params.id);
    const repo = await dbOps.get<Repository>("repos", id);
    if (!repo) {
      return HttpResponse.json(
        { message: "Repository not found" },
        { status: 404 },
      );
    }

    const scanning: Repository = { ...repo, scanStatus: "scanning" };
    await dbOps.put("repos", scanning);

    await delay(2000);

    const result = randomScanResult();
    const scanned: Repository = {
      ...repo,
      ...result,
      scanStatus: "idle",
      lastScanAt: new Date().toISOString(),
    };
    await dbOps.put("repos", scanned);

    return HttpResponse.json({ data: scanned });
  }),
];
