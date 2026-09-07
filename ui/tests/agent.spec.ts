import { test, expect } from "@playwright/test";

test.describe("Canvas App", () => {
  test("loads with canvas and chat panel", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator(".excalidraw-container, canvas").first();
    await expect(canvas).toBeVisible({ timeout: 10_000 });

    const chatPanel = page.locator("text=AI Assistant");
    await expect(chatPanel).toBeVisible();

    const textarea = page.locator("textarea");
    await expect(textarea).toBeVisible();
  });

  test("chat panel shows empty state initially", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector("textarea", { timeout: 10_000 });

    const emptyState = page.locator("text=No messages yet");
    await expect(emptyState).toBeVisible();
  });

  test("can type and send a message", async ({ page }) => {
    await page.goto("/");

    await page.waitForSelector("textarea", { timeout: 10_000 });

    const textarea = page.locator("textarea");
    await textarea.fill("draw a green circle with hello world");

    const sendButton = page.locator('button[type="submit"]');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    const userMessage = page.locator("text=draw a green circle with hello world");
    await expect(userMessage).toBeVisible({ timeout: 5_000 });
  });
});
