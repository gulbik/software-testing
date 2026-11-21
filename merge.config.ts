// Used only by `npx playwright merge-reports` in CI: turns the shards' blob reports into
// one HTML report (with traces, screenshots and videos), one JUnit file and one JSON file
// (read by scripts/ci-summary.mjs for the job summary).
export default {
  testDir: './tests',
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
};
