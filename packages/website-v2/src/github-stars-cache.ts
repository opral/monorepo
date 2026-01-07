import githubStarsCache from "./github_repo_stars.gen.json";

type GithubStarsCache = {
  generatedAt: string;
  data: Record<string, number | null>;
};

const cache = githubStarsCache as GithubStarsCache;

function normalizeRepo(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/github\.com\/([^/]+\/[^/]+)/i);
  const repo = urlMatch ? urlMatch[1] : trimmed;
  const normalized = repo.replace(/\.git$/i, "");

  return /^[^/]+\/[^/]+$/.test(normalized) ? normalized : null;
}

export function getGithubStars(repo: string): number | null {
  const normalized = normalizeRepo(repo);
  if (!normalized) return null;

  const key = normalized.toLowerCase();
  if (!(key in cache.data)) {
    console.warn(`GitHub stars missing for ${normalized}.`);
    return null;
  }
  return cache.data[key] ?? null;
}
