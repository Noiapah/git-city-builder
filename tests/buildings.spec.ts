import { test, expect } from "@playwright/test";
import { calendarDays } from "../shared/github";

test("architectural façades render close up and report the building design", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/api/github/**", (route) => {
    const days = calendarDays(2026).map((day, index) => ({
      ...day,
      contributions: index >= 155 && index <= 200 ? 1 + (index % 12) : 0,
    }));
    return route.fulfill({
      json: {
        username: "Architecture",
        year: 2026,
        totalContributions: days.reduce(
          (sum, day) => sum + day.contributions,
          0,
        ),
        days,
      },
    });
  });
  await page.goto("/Architecture/2026");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".legend")).toContainText("Building styles");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  const canvas = await page.locator("canvas").boundingBox();
  let found = false;
  for (let y = 0.25; y <= 0.75 && !found; y += 0.08)
    for (let x = 0.25; x <= 0.75 && !found; x += 0.08) {
      await page.mouse.move(
        canvas!.x + canvas!.width * x,
        canvas!.y + canvas!.height * y,
      );
      const tooltip = page.locator(".hover-tooltip");
      if (
        (await tooltip.isVisible()) &&
        /Brick loft|Glass office|Limestone apartments|Garden studios|Industrial works/.test(
          await tooltip.innerText(),
        )
      )
        found = true;
    }
  expect(found).toBe(true);
  await page.mouse.move(0, 0);
  await page.screenshot({
    path: "artifacts/buildings-closeup.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
