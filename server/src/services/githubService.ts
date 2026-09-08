import { calendarDays, type ContributionYear } from "../../../shared/github.js";
export class GithubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
interface Calendar {
  weeks: {
    contributionDays: {
      date: string;
      weekday: number;
      contributionCount: number;
    }[];
  }[];
}
export function normalizeCalendar(
  username: string,
  year: number,
  calendar: Calendar,
): ContributionYear {
  const counts = new Map(
    calendar.weeks
      .flatMap((week) => week.contributionDays)
      .map((day) => [day.date, day.contributionCount]),
  );
  const days = calendarDays(year).map((day) => ({
    ...day,
    contributions: counts.get(day.date) ?? 0,
  }));
  return {
    username,
    year,
    totalContributions: days.reduce((sum, day) => sum + day.contributions, 0),
    days,
  };
}
export async function getContributions(
  username: string,
  year: number,
  fetcher: typeof fetch = fetch,
): Promise<ContributionYear> {
  const token = process.env.GITHUB_TOKEN;
  if (!token || token === "your_github_token_here")
    throw new GithubError(
      503,
      "GitHub access is not configured. Add GITHUB_TOKEN to server/.env and restart the server.",
    );
  let response: Response;
  try {
    response = await fetcher("https://api.github.com/graphql", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "github-city",
      },
      body: JSON.stringify({
        query: `query($login: String!, $from: DateTime!, $to: DateTime!) { user(login: $login) { login contributionsCollection(from: $from, to: $to) { contributionCalendar { totalContributions weeks { contributionDays { date weekday contributionCount } } } } } }`,
        variables: {
          login: username,
          from: `${year}-01-01T00:00:00Z`,
          to: `${year}-12-31T23:59:59Z`,
        },
      }),
    });
  } catch {
    throw new GithubError(
      502,
      "Could not reach GitHub. Please try again in a moment.",
    );
  }
  if (response.status === 401)
    throw new GithubError(
      502,
      "The server’s GitHub token is invalid or expired. Update GITHUB_TOKEN in server/.env.",
    );
  if (response.status === 403 || response.status === 429)
    throw new GithubError(
      429,
      "GitHub access is restricted or its rate limit was reached. Please try again later.",
    );
  if (!response.ok)
    throw new GithubError(
      502,
      "GitHub is temporarily unavailable. Please try again.",
    );
  let payload: {
    data?: {
      user: {
        login: string;
        contributionsCollection: { contributionCalendar: Calendar };
      } | null;
    };
    errors?: { type?: string }[];
  };
  try {
    payload = await response.json();
  } catch {
    throw new GithubError(
      502,
      "GitHub returned an unreadable response. Please try again.",
    );
  }
  if (payload.errors?.some((error) => error.type === "RATE_LIMITED"))
    throw new GithubError(
      429,
      "GitHub’s rate limit was reached. Please try again later.",
    );
  if (
    payload.errors?.some((error) => error.type === "NOT_FOUND") ||
    payload.data?.user === null
  )
    throw new GithubError(
      404,
      "That GitHub user could not be found. Check the username and try again.",
    );
  if (payload.errors?.length || !payload.data?.user)
    throw new GithubError(
      502,
      "GitHub could not return contributions. Check the server token’s access and try again.",
    );
  const user = payload.data.user;
  return normalizeCalendar(
    user.login,
    year,
    user.contributionsCollection.contributionCalendar,
  );
}
