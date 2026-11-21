// Writes a Markdown summary of the merged Playwright JSON report to the GitHub job summary
// ($GITHUB_STEP_SUMMARY): totals, then every failed and flaky test with its file:line and
// the first lines of its error. No dependencies.
//   node scripts/ci-summary.mjs reports/results.json
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const reportPath = process.argv[2] ?? 'reports/results.json';
const out = process.env.GITHUB_STEP_SUMMARY;
const write = (text) => (out ? appendFileSync(out, text) : process.stdout.write(text));

if (!existsSync(reportPath)) {
  write(`## Playwright\n\nNo report found at \`${reportPath}\`: the test jobs did not produce results.\n`);
  process.exit(0);
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'));
const rootDir = report.config?.rootDir ?? process.cwd();
const stripAnsi = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');

function* specs(suite, titles = []) {
  const path = suite.title ? [...titles, suite.title] : titles;
  for (const spec of suite.specs ?? []) yield { spec, path };
  for (const child of suite.suites ?? []) yield* specs(child, path);
}

const failed = [];
const flaky = [];
for (const root of report.suites ?? []) {
  for (const { spec, path } of specs(root)) {
    for (const test of spec.tests) {
      const entry = {
        title: [...path.slice(1), spec.title].join(' › '),
        location: `${relative(process.cwd(), join(rootDir, spec.file))}:${spec.line}`,
        results: test.results,
      };
      if (test.status === 'unexpected') failed.push(entry);
      if (test.status === 'flaky') flaky.push(entry);
    }
  }
}

const { expected = 0, unexpected = 0, flaky: flakyCount = 0, skipped = 0, duration = 0 } = report.stats ?? {};
const icon = unexpected > 0 ? '❌' : flakyCount > 0 ? '⚠️' : '✅';
let md = `## ${icon} Playwright: ${expected} passed, ${unexpected} failed, ${flakyCount} flaky, ${skipped} skipped (${(duration / 1000).toFixed(1)} s)\n\n`;

const firstError = (results) => {
  const error = results.find((r) => r.status !== 'passed' && r.status !== 'skipped')?.error;
  if (!error) return 'no error message';
  return stripAnsi(error.message ?? String(error.value ?? '')).split('\n').slice(0, 12).join('\n').trim();
};

if (failed.length) {
  md += `### Failed (blocks the merge)\n\n`;
  for (const t of failed) {
    md += `<details open><summary><b>${t.title}</b> — <code>${t.location}</code> (${t.results.length} attempt(s))</summary>\n\n\`\`\`\n${firstError(t.results)}\n\`\`\`\n</details>\n\n`;
  }
}
if (flaky.length) {
  md += `### Flaky: failed first, passed on retry (reported, does not block)\n\n`;
  for (const t of flaky) {
    md += `<details><summary><b>${t.title}</b> — <code>${t.location}</code></summary>\n\n\`\`\`\n${firstError(t.results)}\n\`\`\`\n</details>\n\n`;
  }
}
md += `Download the **playwright-report** artifact and open \`index.html\` for screenshots, video and the trace of every failed attempt.\n`;
write(md);
