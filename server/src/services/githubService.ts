import type { ContributionYear } from "../../../shared/github.js";
import { parseCalendar } from "./githubCalendar.js";

export class GithubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_CACHED_CITIES = 100;

export function createContributionService(
  fetcher: typeof fetch = fetch,
  now = Date.now,
) {
  const cache = new Map<string, { data: ContributionYear; expires: number }>();
  const pending = new Map<string, Promise<ContributionYear>>();

  async function fetchCalendar(
    username: string,
    year: number,
  ): Promise<ContributionYear> {
    const url = new URL(
      `https://github.com/users/${encodeURIComponent(username)}/contributions`,
    );
    url.searchParams.set("from", `${year}-01-01`);
    url.searchParams.set("to", `${year}-12-31`);
    let response: Response;
    try {
      response = await fetcher(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          Accept: "text/html",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "github-city",
        },
      });
    } catch {
      throw new GithubError(
        502,
        "Could not reach GitHub. Please try again in a moment.",
      );
    }
    if (response.status === 404)
      throw new GithubError(
        404,
        "That GitHub user could not be found. Check the username and try again.",
      );
    if (response.status === 403 || response.status === 429)
      throw new GithubError(
        429,
        "GitHub is temporarily limiting requests. Please try again later.",
      );
    if (!response.ok)
      throw new GithubError(
        502,
        "GitHub is temporarily unavailable. Please try again.",
      );
    try {
      return parseCalendar(
        username,
        year,
        await response.text(),
        new Date(now()),
      );
    } catch {
      throw new GithubError(
        502,
        "GitHub’s public contribution calendar could not be read. Please try again later.",
      );
    }
  }

  return async function getContributions(
    username: string,
    year: number,
  ): Promise<ContributionYear> {
    const key = `${username.toLowerCase()}/${year}`;
    const cached = cache.get(key);
    if (cached && cached.expires > now()) return cached.data;
    cache.delete(key);
    const existing = pending.get(key);
    if (existing) return existing;
    const request = fetchCalendar(username, year)
      .then((data) => {
        if (cache.size >= MAX_CACHED_CITIES)
          cache.delete(cache.keys().next().value!);
        cache.set(key, { data, expires: now() + CACHE_TTL_MS });
        return data;
      })
      .finally(() => pending.delete(key));
    pending.set(key, request);
    return request;
  };
}

export const getContributions = createContributionService();
