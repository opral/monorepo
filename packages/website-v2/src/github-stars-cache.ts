import githubCache from "./github_repo_data.gen.json";

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

const cache = githubCache as GithubCache;

function normalizeRepo(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/i);
  const repo = urlMatch ? urlMatch[1] : trimmed;
  const normalized = repo.replace(/\.git$/i, "");

  return /^[^/]+\/[^/]+$/.test(normalized) ? normalized : null;
}

export function getGithubRepoMetrics(repo: string): GithubRepoMetrics | null {
  const normalized = normalizeRepo(repo);
  if (!normalized) return null;

  const key = normalized.toLowerCase();
  if (!(key in cache.data)) {
    console.warn(`GitHub data missing for ${normalized}.`);
    return null;
  }
  return cache.data[key] ?? null;
}

// Convenience function for backward compatibility
export function getGithubStars(repo: string): number | null {
  const metrics = getGithubRepoMetrics(repo);
  return metrics?.stars ?? null;
}
