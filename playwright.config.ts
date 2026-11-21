import { defineConfig, devices, ReporterDescription } from '@playwright/test';

const isCI = !!process.env.CI;

// On CI every shard writes a blob report (merged into one HTML/JUnit report by the
// merge-reports job), a JUnit file of its own, and GitHub annotations that point at the
// failing line in the PR diff. Locally: a readable list and the HTML report.
const ciReporters: ReporterDescription[] = [
  ['list'],
  ['github'],
  ['blob'],
  ['junit', { outputFile: 'reports/junit.xml' }],
  ['html', { open: 'never' }],
];
const localReporters: ReporterDescription[] = [['list'], ['html', { open: 'never' }]];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // A committed test.only would silently skip the rest of the suite: fail the run instead.
  forbidOnly: isCI,
  // Up to two retries absorb one-off hiccups (a container still warming up). A test that
  // passes only on a retry is reported as "flaky" instead of hiding the problem.
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : 4,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: isCI ? ciReporters : localReporters,
  use: {
    baseURL: process.env.BASE_URL ?? 'https://practicesoftwaretesting.com',
    testIdAttribute: 'data-test',
    locale: 'en-US',
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
