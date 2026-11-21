import { expect, test } from "playwright/test";

const presentations = [
  { width: 320, theme: "light" },
  { width: 360, theme: "light" },
  { width: 390, theme: "light" },
  { width: 900, theme: "light" },
  { width: 1440, theme: "light" },
  { width: 390, theme: "dark" },
  { width: 320, theme: "dark" },
  { width: 360, theme: "dark" },
  { width: 900, theme: "dark" },
  { width: 1440, theme: "dark" },
];

test("docs header stays full width and sticky", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  await page.goto("docs/installation/");
  await expect(page.getByRole("button", { name: "Toggle theme" })).toBeEnabled();
  const header = page.locator("header").first();
  const before = await header.boundingBox();
  expect(before?.x).toBe(0);
  expect(before?.width).toBe(900);
  await page.evaluate(() => window.scrollTo(0, 350));
  const after = await header.boundingBox();
  expect(after?.y).toBe(0);
});

test("header announces only the exact current page", async ({ page }) => {
  await page.goto("docs/installation/");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  const docs = navigation.getByRole("link", { name: "Docs", exact: true });
  await expect(docs).not.toHaveAttribute("aria-current");
  await docs.click();
  await expect(docs).toHaveAttribute("aria-current", "page");
  await page.getByRole("link", { name: "Next Installation" }).click();
  await expect(docs).not.toHaveAttribute("aria-current");
  const home = navigation.getByRole("link", { name: "Spreadsheet", exact: true });
  await home.click();
  await expect(home).toHaveAttribute("aria-current", "page");
  await expect(docs).not.toHaveAttribute("aria-current");
});

test("docs group expands and collapses", async ({ page }) => {
  await page.goto("docs/installation/");
  await expect(page.getByRole("button", { name: "Toggle theme" })).toBeEnabled();
  const navigation = page.getByRole("navigation", { name: "Documentation", exact: true });
  const group = navigation.getByRole("button", { name: "Getting Started" });
  await expect(group).toHaveAttribute("aria-expanded", "true");
  await group.click();
  await expect(navigation.getByRole("link", { name: "Quick Start" })).toBeHidden();
  await group.click();
  await expect(navigation.getByRole("link", { name: "Quick Start" })).toBeVisible();
});

test("docs current page survives direct and client navigation", async ({ page }) => {
  await page.goto("docs/installation/");
  const navigation = page.getByRole("navigation", { name: "Documentation", exact: true });
  await expect(navigation.getByRole("link", { name: "Installation" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await navigation.getByRole("link", { name: "Quick Start" }).click();
  await expect(navigation.getByRole("link", { name: "Quick Start" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(navigation.locator('[aria-current="page"]')).toHaveCount(1);
  await page.goBack();
  await expect(navigation.getByRole("link", { name: "Installation" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("docs drawer opens below md and returns focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("docs/installation/");
  const trigger = page.getByRole("button", { name: "Toggle Sidebar" });
  await trigger.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(trigger).toBeFocused();
});

test("docs sidebar switches at md and drawer links close it", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 800 });
  await page.goto("docs/installation/");
  const trigger = page.getByRole("button", { name: "Toggle Sidebar" });
  const navigation = page.getByRole("navigation", { name: "Documentation", exact: true });
  await expect(navigation).toBeVisible();
  await expect(trigger).toBeHidden();
  await page.setViewportSize({ width: 767, height: 800 });
  await expect(navigation).toBeHidden();
  await trigger.click();
  await page.getByRole("dialog").getByRole("link", { name: "Quick Start" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Quick Start", exact: true })).toBeVisible();
});

["Control+b", "Meta+b"].forEach((shortcut) => {
  test(`docs desktop navigation stays visible after ${shortcut}`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await page.goto("docs/installation/");
    await expect(page.getByRole("button", { name: "Toggle theme" })).toBeEnabled();
    const navigation = page.getByRole("navigation", { name: "Documentation", exact: true });
    await expect(navigation).toBeInViewport();
    await page.keyboard.press(shortcut);
    await page.waitForTimeout(300);
    await expect(navigation).toBeInViewport();
  });
});

test("docs outline appears at lg and keeps hash targets below the header", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("docs/installation/");
  const outline = page.getByRole("navigation", { name: "On this page", exact: true });
  await expect(outline).toBeVisible();
  await outline.getByRole("link", { name: "Node.js Usage" }).click();
  await expect(page).toHaveURL(/#nodejs-usage$/);
  const heading = page.locator("#nodejs-usage");
  await expect.poll(async () => (await heading.boundingBox())?.y).toBeGreaterThanOrEqual(64);
  await page.setViewportSize({ width: 1023, height: 800 });
  await expect(outline).toBeHidden();
});

test("docs breadcrumbs and adjacent pages follow the sidebar order", async ({ page }) => {
  await page.goto("docs/installation/");
  const breadcrumb = page.getByRole("navigation", { name: "breadcrumb", exact: true });
  await expect(breadcrumb.locator('[aria-current="page"]')).toHaveText("Installation");
  const pagination = page.getByRole("navigation", { name: "Documentation pages" });
  await expect(pagination.getByRole("link", { name: "Previous Introduction" })).toBeVisible();
  await pagination.getByRole("link", { name: "Next Quick Start" }).click();
  await expect(page.getByRole("heading", { name: "Quick Start", exact: true })).toBeVisible();
  await expect(pagination.getByRole("link", { name: /^Next/ })).toHaveCount(0);
});

test("docs scrollspy follows scrolling and route changes", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 });
  await page.goto("docs/installation/#nodejs-usage");
  const outline = page.getByRole("navigation", { name: "On this page", exact: true });
  const active = outline.locator('[aria-current="location"]');
  await expect(active).toHaveText("Node.js Usage");
  await outline.getByRole("link", { name: "TypeScript" }).click();
  await expect(active).toHaveText("TypeScript");
  await page
    .getByRole("navigation", { name: "Documentation", exact: true })
    .getByRole("link", { name: "Quick Start" })
    .click();
  await expect(outline.getByRole("link", { name: "Basic Example" })).toBeVisible();
  await expect(outline.getByRole("link", { name: "TypeScript" })).toHaveCount(0);
});

presentations.forEach(({ width, theme }) => {
  test(`docs presentation at ${width}px in ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.goto("docs/installation/");
    await expect(page.getByRole("button", { name: "Toggle theme" })).toBeEnabled();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    const outline = page.getByRole("navigation", { name: "On this page", exact: true });
    const visible = width >= 1024;
    await expect(outline).toBeVisible({ visible });
    const path = `../tmp/docs-${theme}-${width}.png`;
    await page.screenshot({ path });
  });
});
