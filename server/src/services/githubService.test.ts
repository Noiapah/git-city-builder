import { test } from "node:test";
import assert from "node:assert/strict";
import { createContributionService } from "./githubService.js";
import { parseCalendar } from "./githubCalendar.js";
import { calendarDays } from "../../../shared/github.js";

function calendarHtml(year: number, overrides: Record<string, string> = {}) {
  return `<div data-graph-url="/users/Noiapah/contributions"><table><tbody><tr>${calendarDays(
    year,
  )
    .map(
      (day) =>
        `<td class="ContributionCalendar-day" data-level="4" data-date="${day.date}" id="day-${day.date}"></td>`,
    )
    .join("")}</tr></tbody></table>${calendarDays(year)
    .map(
      (day) =>
        `<tool-tip for="day-${day.date}">${overrides[day.date] ?? "No contributions"} on a day.</tool-tip>`,
    )
    .join("")}</div>`;
}
const yearHtml = calendarHtml(2024, {
  "2024-02-29": "12 contributions",
  "2024-03-01": "1 contribution",
  "2024-03-02": "1,234 contributions",
});

test("HTML parsing joins tooltips to dates and preserves exact counts, leap days, and week alignment", () => {
  const data = parseCalendar("noiapah", 2024, yearHtml);
  assert.equal(data.username, "Noiapah");
  assert.equal(data.days.length, 366);
  assert.equal(data.totalContributions, 1247);
  assert.deepEqual(data.days[0], {
    date: "2024-01-01",
    weekday: 1,
    week: 0,
    contributions: 0,
  });
  assert.equal(data.days[6].week, 1);
  assert.equal(data.days[6].weekday, 0);
  assert.equal(data.days[59].date, "2024-02-29");
  assert.equal(data.days[59].contributions, 12);
});

test("zero years are valid, boundary dates are ignored, and absent future dates become empty plots", () => {
  const empty = calendarHtml(2024);
  assert.equal(parseCalendar("Noiapah", 2024, empty).totalContributions, 0);
  assert.equal(
    parseCalendar(
      "Noiapah",
      2024,
      empty +
        '<div class="ContributionCalendar-day" data-date="2023-12-31" data-count="99"></div>',
    ).days.length,
    366,
  );
  const current =
    '<div class="ContributionCalendar-day" data-date="2026-01-01" data-count="20"></div>';
  const data = parseCalendar(
    "Noiapah",
    2026,
    current,
    new Date("2026-01-01T12:00:00Z"),
  );
  assert.equal(data.days.length, 365);
  assert.equal(data.totalContributions, 20);
  assert.equal(data.days[1].contributions, 0);
});

test("changed HTML, missing counts, duplicates, partial calendars and blocked pages fail instead of creating empty cities", () => {
  for (const html of [
    "<h1>Please sign in</h1>",
    "",
    yearHtml.replace('data-date="2024-02-29"', 'data-date="2023-02-28"'),
    yearHtml.replace("12 contributions", "Some contributions"),
    yearHtml +
      '<div class="ContributionCalendar-day" data-date="2024-01-01" data-count="1"></div>',
    yearHtml.replace(
      "12 contributions",
      "9999999999999999999999 contributions",
    ),
  ]) {
    assert.throws(() => parseCalendar("Noiapah", 2024, html));
  }
});

test("requests use public HTML without credentials and translate HTTP/network/parser errors", async () => {
  const service = createContributionService(async (input, init) => {
    const url = new URL(String(input));
    assert.equal(url.origin, "https://github.com");
    assert.equal(url.pathname, "/users/Noiapah/contributions");
    assert.equal(url.searchParams.get("from"), "2024-01-01");
    assert.equal(url.searchParams.get("to"), "2024-12-31");
    const headers = new Headers(init?.headers);
    assert.equal(headers.has("Authorization"), false);
    assert.equal(headers.has("Cookie"), false);
    assert.equal(headers.get("Accept"), "text/html");
    assert.ok(headers.get("Accept-Language")?.startsWith("en-US"));
    assert.equal(init?.body, undefined);
    assert.ok(init?.signal);
    return new Response(yearHtml);
  });
  assert.equal((await service("Noiapah", 2024)).totalContributions, 1247);
  for (const [status, expected] of [
    [404, 404],
    [403, 429],
    [429, 429],
    [500, 502],
    [401, 502],
    [200, 502],
  ]) {
    const failing = createContributionService(
      async () => new Response("secret upstream detail", { status }),
    );
    await assert.rejects(
      failing("Noiapah", 2024),
      (error: unknown) =>
        error instanceof Error &&
        "status" in error &&
        error.status === expected &&
        !error.message.includes("secret"),
    );
  }
  await assert.rejects(
    createContributionService(async () => {
      throw new Error("network");
    })("Noiapah", 2024),
    { status: 502 },
  );
});

test("successful requests are cached, simultaneous requests deduplicated, and cache expires", async () => {
  let time = Date.parse("2026-09-08T00:00:00Z");
  let calls = 0;
  const service = createContributionService(
    async () => {
      calls++;
      return new Response(yearHtml);
    },
    () => time,
  );
  await Promise.all([service("Noiapah", 2024), service("noiapah", 2024)]);
  await service("NOIAPAH", 2024);
  assert.equal(calls, 1);
  time += 15 * 60 * 1000;
  await service("Noiapah", 2024);
  assert.equal(calls, 2);
});

test("failed requests can be retried", async () => {
  let calls = 0;
  const service = createContributionService(async () =>
    ++calls === 1
      ? new Response("blocked", { status: 429 })
      : new Response(yearHtml),
  );
  await assert.rejects(service("Noiapah", 2024), { status: 429 });
  assert.equal((await service("Noiapah", 2024)).totalContributions, 1247);
  assert.equal(calls, 2);
});
