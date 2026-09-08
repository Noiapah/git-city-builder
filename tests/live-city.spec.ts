import { test, expect } from "@playwright/test";

test("public GitHub city loads from a username without a token", async ({
  page,
}) => {
  test.skip(
    !process.env.LIVE_GITHUB,
    "Set LIVE_GITHUB=1 to test against public GitHub.",
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("textbox", { name: "GitHub username" }).fill("Noiapah");
  await page.getByRole("combobox").selectOption("2026");
  const responsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/github/Noiapah/contributions"),
  );
  await page.getByRole("button", { name: "Build City" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const data = await response.json();
  expect(data.days).toHaveLength(365);
  expect(data.totalContributions).toBeGreaterThan(0);
  expect(data.totalContributions).toBe(
    data.days.reduce(
      (sum: number, day: { contributions: number }) => sum + day.contributions,
      0,
    ),
  );
  await expect(page.locator(".city-toolbar")).toContainText(
    `${data.totalContributions.toLocaleString()} contributions`,
  );
  await expect(page.locator("canvas")).toBeVisible();
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".city-toolbar")).toContainText(
    `${data.totalContributions.toLocaleString()} contributions`,
  );
  await page.screenshot({ path: "artifacts/live-city.png", fullPage: true });
  expect(errors).toEqual([]);
});
