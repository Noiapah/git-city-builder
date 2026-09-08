import { test } from "node:test";
import assert from "node:assert/strict";
import { getContributions, normalizeCalendar } from "./githubService.js";
import { calendarDays } from "../../../shared/github.js";
test("normalization fills leap years, ignores boundary days, and aligns Sunday weeks", () => {
  const data = normalizeCalendar("Noiapah", 2024, {
    weeks: [
      {
        contributionDays: [
          { date: "2023-12-31", weekday: 0, contributionCount: 99 },
          { date: "2024-02-29", weekday: 4, contributionCount: 12 },
        ],
      },
    ],
  });
  assert.equal(data.days.length, 366);
  assert.equal(data.totalContributions, 12);
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
  assert.equal(calendarDays(2026).length, 365);
});
test("GitHub success and errors are translated without leaking upstream details", async (t) => {
  const original = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";
  t.after(() => {
    if (original === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = original;
  });
  const mock = (body: unknown, status = 200) =>
    (async () =>
      new Response(JSON.stringify(body), { status })) as typeof fetch;
  const success = await getContributions(
    "Noiapah",
    2026,
    mock({
      data: {
        user: {
          login: "Noiapah",
          contributionsCollection: { contributionCalendar: { weeks: [] } },
        },
      },
    }),
  );
  assert.equal(success.days.length, 365);
  assert.equal(success.totalContributions, 0);
  for (const [body, status, expected] of [
    [{}, 401, 502],
    [{}, 429, 429],
    [{ errors: [{ type: "RATE_LIMITED" }] }, 200, 429],
    [{ data: { user: null } }, 200, 404],
    [{ errors: [{ message: "secret internal detail" }] }, 200, 502],
  ] as const) {
    await assert.rejects(
      getContributions("Noiapah", 2026, mock(body, status)),
      (error: any) =>
        error.status === expected && !error.message.includes("secret"),
    );
  }
  await assert.rejects(
    getContributions("Noiapah", 2026, (async () => {
      throw new Error("network");
    }) as typeof fetch),
    { status: 502 },
  );
  delete process.env.GITHUB_TOKEN;
  await assert.rejects(getContributions("Noiapah", 2026, mock({})), {
    status: 503,
  });
});
