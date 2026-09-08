import type { ContributionYear } from "../../../shared/github";
export async function fetchContributions(
  username: string,
  year: number,
  signal: AbortSignal,
): Promise<ContributionYear> {
  let response: Response;
  try {
    response = await fetch(
      `/api/github/${encodeURIComponent(username)}/contributions?year=${year}`,
      { signal },
    );
  } catch (error) {
    if (signal.aborted) throw error;
    throw new Error(
      "Cannot reach the server. Make sure the backend is running and check your connection.",
    );
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      "The backend is unavailable. Start the server and try again.",
    );
  }
  if (!response.ok)
    throw new Error(
      payload.error || "Unable to load contributions. Please try again.",
    );
  if (!Array.isArray(payload.days))
    throw new Error(
      "The server returned an unexpected response. Please try again.",
    );
  return payload;
}
