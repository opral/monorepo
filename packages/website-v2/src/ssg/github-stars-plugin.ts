import path from "node:path";
import fs from "node:fs/promises";
import { registry } from "@inlang/marketplace-registry";

export type GithubRepoMetrics = {
  stars: number;
  forks: number;
  openIssues: number;
  closedIssues: number;
  contributorCount: number;
};

type GithubCache = {
  generatedAt: string;
  data: Record<string, GithubRepoMetrics | null>;
};

const GITHUB_CACHE_TTL_MINUTES = 60;
const githubCachePath = path.join(
  __dirname,
  "..",
  "github_repo_data.gen.json",
);
let didLogGithubToken = false;

export function githubStarsPlugin({ token }: { token?: string }) {
  return {
    name: "inlang:github-data",
    async buildStart() {
      await ensureGithubCache(token);
    },
    async configureServer() {
      await ensureGithubCache(token);
    },
  };
}

async function ensureGithubCache(token?: string) {
  if (token && !didLogGithubToken) {
    console.info("Using INLANG_WEBSITE_GITHUB_TOKEN for GitHub API requests.");
    didLogGithubToken = true;
  }
  const cached = await readGithubCache();
  if (cached && !isCacheExpired(cached)) return;

  const repos = getGithubReposFromRegistry();
  repos.add("opral/inlang");

  const data: Record<string, GithubRepoMetrics | null> = {};
  for (const repo of repos) {
    const metrics = await fetchGithubRepoMetrics(repo, token);
    data[repo.toLowerCase()] = metrics;
  }

  const payload: GithubCache = {
    generatedAt: new Date().toISOString(),
    data,
  };

  await fs.writeFile(githubCachePath, JSON.stringify(payload, null, 2) + "\n");
}

async function readGithubCache(): Promise<GithubCache | null> {
  try {
    const raw = await fs.readFile(githubCachePath, "utf8");
    return JSON.parse(raw) as GithubCache;
  } catch {
    return null;
  }
}

function isCacheExpired(cache: GithubCache) {
  const generatedAt = Date.parse(cache.generatedAt);
  if (Number.isNaN(generatedAt)) return true;
  const ttlMs = GITHUB_CACHE_TTL_MINUTES * 60 * 1000;
  return Date.now() - generatedAt > ttlMs;
}

function getGithubReposFromRegistry() {
  const repos = new Set<string>();
  for (const entry of registry as Array<{ repository?: string }>) {
    if (!entry.repository) continue;
    const normalized = normalizeGithubRepo(entry.repository);
    if (normalized) repos.add(normalized);
  }
  return repos;
}

function normalizeGithubRepo(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/i);
  const repo = urlMatch ? urlMatch[1] : trimmed;
  const normalized = repo.replace(/\.git$/i, "");
  return /^[^/]+\/[^/]+$/.test(normalized) ? normalized : null;
}

function getHeaders(token?: string) {
  return {
    Accept: "application/vnd.github+json",
    "User-Agent": "inlang-website-v2",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchGithubRepoMetrics(
  repo: string,
  token?: string,
): Promise<GithubRepoMetrics | null> {
  try {
    // Fetch repo info (stars, forks, open issues)
    const repoRes = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: getHeaders(token),
    });

    if (!repoRes.ok) {
      console.warn(`GitHub repo fetch failed for ${repo}: ${repoRes.status}`);
      return null;
    }

    const repoData = (await repoRes.json()) as {
      stargazers_count?: number;
      forks_count?: number;
      open_issues_count?: number;
    };

    // Fetch closed issues count via search API
    const closedIssuesRes = await fetch(
      `https://api.github.com/search/issues?q=repo:${repo}+is:issue+is:closed&per_page=1`,
      { headers: getHeaders(token) },
    );

    let closedIssues = 0;
    if (closedIssuesRes.ok) {
      const closedData = (await closedIssuesRes.json()) as {
        total_count?: number;
      };
      closedIssues = closedData.total_count ?? 0;
    }

    // Fetch contributor count (use per_page=1 and check Link header for total, or use anon=1 to get accurate count)
    const contributorsRes = await fetch(
      `https://api.github.com/repos/${repo}/contributors?per_page=1&anon=1`,
      { headers: getHeaders(token) },
    );

    let contributorCount = 0;
    if (contributorsRes.ok) {
      // GitHub returns the total count in the Link header's last page number
      const linkHeader = contributorsRes.headers.get("Link");
      if (linkHeader) {
        const lastMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (lastMatch) {
          contributorCount = parseInt(lastMatch[1], 10);
        }
      } else {
        // If no Link header, there's only one page - count the response
        const data = (await contributorsRes.json()) as unknown[];
        contributorCount = data.length;
      }
    }

    return {
      stars: repoData.stargazers_count ?? 0,
      forks: repoData.forks_count ?? 0,
      openIssues: repoData.open_issues_count ?? 0,
      closedIssues,
      contributorCount,
    };
  } catch (error) {
    console.warn(`GitHub fetch failed for ${repo}`, error);
    return null;
  }
}
