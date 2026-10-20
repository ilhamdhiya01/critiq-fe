import {
  NAVIGATION_ITEMS,
  type NavigationItem,
} from "@/const/navigation.constant";
import { RULE_TIER_META } from "@/const/rules.constant";
import { SEARCH_MAX_LENGTH } from "@/const/search.constant";
import type {
  GlobalSearchResult,
  SearchEntry,
  SearchEntryMeta,
  SearchRepository,
} from "@/lib/types/search.types";
import { ROUTES } from "@/routes";

export const isSearchableQuery = (query: string): boolean => {
  const q = query.trim();
  return q.length > 0 && q.length <= SEARCH_MAX_LENGTH;
};

// PAGES are filtered locally; an empty query lists them all.
export const filterSearchPages = (query: string): readonly NavigationItem[] => {
  const q = query.trim().toLowerCase();
  return q
    ? NAVIGATION_ITEMS.filter((item) => item.label.toLowerCase().includes(q))
    : NAVIGATION_ITEMS;
};

// Open criticals win over the language; nothing when neither is known.
export const getRepoMeta = (repo: SearchRepository): SearchEntryMeta | null => {
  if (repo.openCriticalCount > 0) {
    return { kind: "critical", text: `${repo.openCriticalCount} critical` };
  }
  return repo.language ? { kind: "language", text: repo.language } : null;
};

const tierTitle = (tier: string): string =>
  tier in RULE_TIER_META
    ? RULE_TIER_META[tier as keyof typeof RULE_TIER_META].title
    : tier;

// Flat list in display order (repos → PRs → rules → pages), so ↑/↓ move
// across groups.
export const buildSearchEntries = (
  result: GlobalSearchResult | undefined,
  pages: readonly NavigationItem[],
  slug: string,
): SearchEntry[] => [
  ...(result?.repositories ?? []).map((repo): SearchEntry => ({
    key: `repo:${repo.id}`,
    group: "repositories",
    label: repo.path,
    meta: getRepoMeta(repo),
    href: ROUTES.repositoryDetail(slug, repo.id),
  })),
  ...(result?.pulls ?? []).map((pull): SearchEntry => ({
    key: `pull:${pull.id}`,
    group: "pulls",
    label: `#${pull.number} ${pull.title}`,
    meta: { kind: "pull", repoPath: pull.repoPath, state: pull.state },
    href: ROUTES.pullRequestDetail(slug, pull.id, pull.repoId),
  })),
  ...(result?.rules ?? []).map((rule): SearchEntry => ({
    key: `rule:${rule.kind}:${rule.id}`,
    group: "rules",
    label: rule.label,
    meta:
      rule.kind === "rule"
        ? { kind: "text", text: tierTitle(rule.tier) }
        : null,
    href: `${ROUTES.rules(slug)}?tier=${encodeURIComponent(rule.tier)}`,
  })),
  ...pages.map((page): SearchEntry => ({
    key: `page:${page.label}`,
    group: "pages",
    label: page.label,
    meta: null,
    href: page.buildHref(slug),
  })),
];

// Splits `text` around every case-insensitive occurrence of `query`.
export const splitHighlight = (
  text: string,
  query: string,
): { text: string; isMatch: boolean }[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [{ text, isMatch: false }];

  const parts: { text: string; isMatch: boolean }[] = [];
  const lower = text.toLowerCase();
  let cursor = 0;
  let index = lower.indexOf(q);
  while (index !== -1) {
    if (index > cursor) {
      parts.push({ text: text.slice(cursor, index), isMatch: false });
    }
    parts.push({ text: text.slice(index, index + q.length), isMatch: true });
    cursor = index + q.length;
    index = lower.indexOf(q, cursor);
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor), isMatch: false });
  }
  return parts;
};

// "acme/payments-api" → "payments-api".
export const getRepoName = (path: string): string =>
  path.slice(path.lastIndexOf("/") + 1);
