import { test, expect } from "@playwright/test";
import { calendarDays } from "../shared/github";
test("landing sample renders, validates input, supports day inspection, and fits mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "GitHub City" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Build City" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Enter a GitHub username",
  );
  const canvas = await page.locator("canvas").boundingBox();
  let found = false;
  for (let y = 0.35; y <= 0.7 && !found; y += 0.05)
    for (let x = 0.25; x <= 0.75 && !found; x += 0.05) {
      await page.mouse.move(
        canvas!.x + canvas!.width * x,
        canvas!.y + canvas!.height * y,
      );
      if (await page.locator(".hover-tooltip").isVisible()) {
        await page.mouse.click(
          canvas!.x + canvas!.width * x,
          canvas!.y + canvas!.height * y,
        );
        found = true;
      }
    }
  expect(found).toBe(true);
  await expect(page.locator(".selected-tooltip")).toContainText("contribution");
  await page.getByRole("button", { name: "Close day details" }).click();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByRole("button", { name: "Reset view" }).click();
  await page.screenshot({
    path: "artifacts/landing-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("canvas")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/landing-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("search, direct links, changing years, loading, retry and empty cities work", async ({
  page,
}) => {
  const years: number[] = [];
  await page.route("**/api/github/**", async (route) => {
    const year = Number(
      new URL(route.request().url()).searchParams.get("year"),
    );
    years.push(year);
    const days = calendarDays(year);
    if (year === 2026) days[0].contributions = 12;
    await new Promise((resolve) => setTimeout(resolve, 250));
    await route.fulfill({
      json: {
        username: "Noiapah",
        year,
        days,
        totalContributions: year === 2026 ? 12 : 0,
      },
    });
  });
  await page.goto("/");
  await page.getByRole("textbox", { name: "GitHub username" }).fill("Noiapah");
  await page.getByRole("combobox").selectOption("2026");
  await page.getByRole("button", { name: "Build City" }).click();
  await expect(page).toHaveURL("/Noiapah/2026");
  await expect(
    page.getByRole("button", { name: "Building city…" }),
  ).toBeDisabled();
  await expect(page.locator(".city-toolbar")).toContainText("12 contributions");
  await expect(page.locator("canvas")).toBeVisible();
  await page.reload();
  await expect(page.locator(".city-toolbar")).toContainText("12 contributions");
  await page.getByRole("combobox").selectOption("2024");
  await expect(page).toHaveURL("/Noiapah/2024");
  await expect(page.locator(".empty-notice")).toContainText("366 empty plots");
  expect(years).toEqual([2026, 2026, 2024]);
  await page.unroute("**/api/github/**");
  await page.route("**/api/github/**", (route) =>
    route.fulfill({
      status: 404,
      json: { error: "That GitHub user could not be found." },
    }),
  );
  await page.goto("/unknown-user/2026");
  await expect(page.getByRole("alert")).toContainText("could not be found");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});
