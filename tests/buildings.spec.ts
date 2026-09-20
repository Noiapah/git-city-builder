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
        /Glass pavilion|White concrete residence|Steel tower/.test(
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

test("architecture switches the rendered city, persists, and fits mobile", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  let requests = 0;
  await page.route("**/api/github/**", (route) => {
    requests++;
    const days = calendarDays(2026).map((day, index) => ({
      ...day,
      contributions: index >= 155 && index <= 200 ? 1 + (index % 8) : 0,
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
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  for (const [name, id, design] of [
    ["Modern", "modern", /Glass pavilion|White concrete residence|Steel tower/],
    [
      "New York",
      "new-york",
      /Brooklyn brownstone|SoHo loft|Manhattan limestone tower/,
    ],
    ["Medieval", "medieval", /Timber guildhall|Merchant house|Stone keep/],
  ] as const) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".city-viewer")).toHaveAttribute(
      "data-architecture",
      id,
    );
    const canvas = (await page.locator("canvas").boundingBox())!;
    let found = false;
    for (let y = 0.25; y <= 0.75 && !found; y += 0.08)
      for (let x = 0.25; x <= 0.75 && !found; x += 0.08) {
        await page.mouse.move(
          canvas.x + canvas.width * x,
          canvas.y + canvas.height * y,
        );
        const tooltip = page.locator(".hover-tooltip");
        if (
          (await tooltip.isVisible()) &&
          design.test(await tooltip.innerText())
        )
          found = true;
      }
    expect(found, `${name} building can be inspected`).toBe(true);
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: `artifacts/architecture-${id}.png`,
      fullPage: true,
    });
  }
  expect(requests).toBe(1);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Medieval", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".city-viewer")).toHaveAttribute(
    "data-architecture",
    "medieval",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "New York", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/architecture-mobile.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
