import { load } from "cheerio";
import { calendarDays, type ContributionYear } from "../../../shared/github.js";

/** Read exact counts from the public calendar, never from its color levels. */
export function parseCalendar(
  username: string,
  year: number,
  html: string,
  today = new Date(),
): ContributionYear {
  const $ = load(html);
  const tooltips = new Map<string, string>();
  $("tool-tip[for]").each((_index, element) => {
    tooltips.set($(element).attr("for")!, $(element).text().trim());
  });
  const days = calendarDays(year);
  const dates = new Set(days.map((day) => day.date));
  const counts = new Map<string, number>();
  $(".ContributionCalendar-day[data-date]").each((_index, element) => {
    const cell = $(element);
    const date = cell.attr("data-date")!;
    if (!dates.has(date)) return;
    const label =
      tooltips.get(cell.attr("id") || "") || cell.attr("aria-label") || "";
    const match = /^(No|\d+|\d{1,3}(?:,\d{3})+) contributions?\b/i.exec(label);
    const rawCount = cell.attr("data-count");
    let count: number;
    if (rawCount !== undefined && /^\d+$/.test(rawCount))
      count = Number(rawCount);
    else if (match)
      count =
        match[1].toLowerCase() === "no"
          ? 0
          : Number(match[1].replaceAll(",", ""));
    else throw new Error("Unrecognized day count");
    if (!Number.isSafeInteger(count) || count < 0 || counts.has(date))
      throw new Error("Invalid or duplicate day count");
    counts.set(date, count);
  });

  // Reject blocked pages and incomplete calendars; only future days may be absent.
  const todayDate = today.toISOString().slice(0, 10);
  if (
    !counts.size ||
    days.some((day) => day.date <= todayDate && !counts.has(day.date))
  )
    throw new Error("Incomplete contribution calendar");
  const graphUrl = $("[data-graph-url]").first().attr("data-graph-url");
  const canonicalName = /^\/users\/([a-z\d-]+)\/contributions$/i.exec(
    graphUrl || "",
  )?.[1];
  if (canonicalName && canonicalName.toLowerCase() === username.toLowerCase())
    username = canonicalName;
  const result = days.map((day) => ({
    ...day,
    contributions: counts.get(day.date) ?? 0,
  }));
  return {
    username,
    year,
    totalContributions: result.reduce(
      (total, day) => total + day.contributions,
      0,
    ),
    days: result,
  };
}
