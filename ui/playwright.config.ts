import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  // Keep the html reporter alongside github annotations; passing --reporter on
  // the command line would replace the list and leave no report to upload.
  reporter: process.env.CI ? [["github"], ["html"]] : [["html"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  // Each server runs its own package's `dev` script from that package's
  // directory. Playwright runs these with cwd defaulting to this config's
  // directory (ui/), where `pnpm --filter <pkg>` scopes to the ui subtree and
  // matches nothing — pnpm then exits immediately and Playwright reports only
  // "webServer exited early". stdout is piped so a future failure says why.
  webServer: [
    {
      command: "pnpm dev",
      cwd: ".",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: "pnpm dev",
      cwd: "../collab-server",
      port: 1234,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
});
