import { expect, test, type Page } from "playwright/test";

test("the homepage Docs link loads the MDX introduction", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openPage(page, "./");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await navigation.getByRole("link", { name: "Docs", exact: true }).click();
  await expect(page).toHaveURL(/\/xldx\/docs\/$/);
  await expect(page.getByRole("heading", { name: "Introduction", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("static documentation supports direct loads and client navigation under /xldx/", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openPage(page, "docs/installation/");
  await expect(page.getByRole("heading", { name: "Installation", exact: true })).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.dataset.navigationCheck = "retained";
  });
  await page.getByRole("link", { name: "Quick Start", exact: true }).click();
  await expect(page).toHaveURL(/\/xldx\/docs\/quick-start\/$/);
  await expect(page.getByRole("heading", { name: "Quick Start", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-navigation-check", "retained");
  await page.goBack();
  await expect(page).toHaveURL(/\/xldx\/docs\/installation\/$/);
  expect(errors).toEqual([]);
});

test("the static homepage hydrates and calculates spreadsheet edits", async ({ page }) => {
  await openPage(page, "./");
  await expect(page.getByRole("textbox", { name: "Formula", exact: true })).toHaveValue(/^=MID\(/);
  const pixel = page.getByRole("button", { name: "C7", exact: true }).locator("..");
  await expect(pixel).toHaveCSS("background-color", "rgb(16, 185, 129)");
  await page.getByRole("button", { name: "C7", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Formula", exact: true })).toHaveAttribute(
    "readonly",
  );
  await page.getByRole("button", { name: "A1", exact: true }).click();
  await page.getByRole("textbox", { name: "Formula", exact: true }).fill("2");
  await page.getByRole("button", { name: "Run", exact: true }).click();
  await expect(pixel).not.toHaveCSS("background-color", "rgb(16, 185, 129)");
  await page.getByRole("button", { name: "B1", exact: true }).dblclick();
  const editor = page.getByRole("textbox", { name: "Edit B1", exact: true });
  await editor.fill("=A1*2");
  await editor.press("Enter");
  await expect(page.getByRole("button", { name: "B1", exact: true })).toHaveText("4");
});

async function openPage(page: Page, path: string) {
  await page.goto(path);
  await expect(page.getByRole("button", { name: "Toggle theme", exact: true })).toBeEnabled();
}
