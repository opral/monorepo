import path from "node:path";
import fs from "node:fs/promises";
import { registry } from "@inlang/marketplace-registry";

type GithubStarsCache = {
  generatedAt: string;
  data: Record<string, number | null>;
};

const GITHUB_STARS_TTL_MINUTES = 60;
const githubStarsPath = path.join(
  __dirname,
  "..",
  "github_repo_stars.gen.json",
);
let didLogGithubToken = false;

export function githubStarsPlugin({ token }: { token?: string }) {
  return {
    name: "inlang:github-stars",
    async buildStart() {
      await ensureGithubStarsCache(token);
    },
    async configureServer() {
      await ensureGithubStarsCache(token);
    },
  };
}

async function ensureGithubStarsCache(token?: string) {
  if (token && !didLogGithubToken) {
    console.info("Using INLANG_WEBSITE_GITHUB_TOKEN for GitHub API requests.");
    didLogGithubToken = true;
  }
  const cached = await readGithubStarsCache();
  if (cached && !isCacheExpired(cached)) return;

  const repos = getGithubReposFromRegistry();
  repos.add("opral/inlang");

  const data: Record<string, number | null> = {};
  for (const repo of repos) {
    const value = await fetchGithubStars(repo, token);
    data[repo.toLowerCase()] = value;
  }

  const payload: GithubStarsCache = {
    generatedAt: new Date().toISOString(),
    data,
  };

  await fs.writeFile(githubStarsPath, JSON.stringify(payload, null, 2) + "\n");
}

async function readGithubStarsCache(): Promise<GithubStarsCache | null> {
  try {
    const raw = await fs.readFile(githubStarsPath, "utf8");
    return JSON.parse(raw) as GithubStarsCache;
  } catch {
    return null;
  }
}

function isCacheExpired(cache: GithubStarsCache) {
  const generatedAt = Date.parse(cache.generatedAt);
  if (Number.isNaN(generatedAt)) return true;
  const ttlMs = GITHUB_STARS_TTL_MINUTES * 60 * 1000;
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

async function fetchGithubStars(repo: string, token?: string) {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "inlang-website-v2",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) {
      let message = "";
      try {
        const bodyText = await res.text();
        const parsed = JSON.parse(bodyText) as { message?: string };
        message = parsed?.message ?? "";
      } catch {
        message = "";
      }
      console.warn(
        `GitHub stars fetch failed for ${repo}: ${res.status} ${res.statusText}. ${message}`,
      );
      return null;
    }
    const body = (await res.json()) as { stargazers_count?: number };
    return typeof body.stargazers_count === "number"
      ? body.stargazers_count
      : null;
  } catch (error) {
    console.warn(`GitHub stars fetch failed for ${repo}`, error);
    return null;
  }
}
