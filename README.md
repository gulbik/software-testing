# Toolshop Playwright tests

[![Playwright Tests](https://github.com/gulbik/software-testing/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/gulbik/software-testing/actions/workflows/playwright.yml?query=branch%3Amain)

Automated UI tests with **Playwright + TypeScript** for <https://practicesoftwaretesting.com/> (Toolshop v5.0): register, log in, buy a product, compare products, reset a password.

| Document | Contents |
|---|---|
| [Description.md](Description.md) | Goal, the test cases (TC-01 … TC-08), bugs found in the application |
| [Prompt.md](Prompt.md) | The exact prompts given to the AI tool, and which tool and model were used |
| [Review.md](Review.md) | What the AI produced, how it was reviewed and changed, and why |
| [Continuous integration](#continuous-integration-sis-3) | The CI pipeline: what runs, what blocks a merge and why, runtime before/after sharding |

## Requirements

- Node.js (tested with Node.js 22) and npm
- Internet access (the tests run against the public site and its API)

## Install and run

```bash
npm install            # installs dependencies and downloads Chromium (postinstall)
npx playwright test    # runs all tests in parallel, headless
```

Other commands:

```bash
npm run test:headed    # watch the browser
npm run report         # open the HTML report of the last run
npm run typecheck      # TypeScript check (Playwright itself does not type-check)
npm run test:ci        # typecheck + tests, for CI
npx playwright test tests/login.spec.ts      # one file
npx playwright test -g "invalid credentials" # one test by name
```

**Optional environment variables:** `BASE_URL` (web app, default `https://practicesoftwaretesting.com`) and `API_URL` (API used for test-data setup, default `https://api.practicesoftwaretesting.com`).

## Project structure

```
playwright.config.ts        Chromium only, parallel, data-test as test id, reports
src/
  api/ToolshopApi.ts        test-data setup through the API (register a user, list products)
  data/testData.ts          Faker-based user/guest factories, unique email, password generator, address
  data/messages.ts          expected UI texts in one place
  fixtures/test.ts          custom fixtures: one per page object, api, registeredUser, products, inStockProducts
  pages/                    page objects: locators + actions, no business assertions
  pages/components/         Header, AddressForm (shared by registration and checkout)
  utils/price.ts            price parsing/formatting
tests/                      specs: only page-object calls and assertions, no locators
```

## Reports and evidence

- `playwright-report/`: HTML report (`npm run report`). A **screenshot of every test's final state** is attached (account page, order confirmation, comparison table, …).
- `test-results/`: for failed tests, the screenshot, **trace** (`npx playwright show-trace <path>/trace.zip`) and video.
- On CI, failed tests are retried once, because the public site resets its database from time to time.

## Continuous integration (SIS 3)

**Platform: GitHub Actions.** The code already lives on GitHub, so Actions needs no extra server, no Docker host and no account: anyone who forks the repository gets the same pipeline. GitLab CI would need the repository mirrored, and Jenkins in Docker would need a machine of mine to be running when the grader pushes.

Workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml). It runs on **every push to any branch, every pull request**, and manually (`workflow_dispatch`).

### What the pipeline does

```
push / pull_request
 ├─ Typecheck ───────────────────────────────┐
 ├─ Tests (shard 1/4) ─┐                     │
 ├─ Tests (shard 2/4) ─┼─► Merge reports     ├─► CI gate   ← the required check
 ├─ Tests (shard 3/4) ─┤   (HTML+JUnit+      │
 └─ Tests (shard 4/4) ─┘    job summary)     │
       └─────────────────────────────────────┘
```

| Job | Steps |
|---|---|
| **Typecheck** | `npm ci --ignore-scripts` (npm cache from `actions/setup-node`, keyed on `package-lock.json`), `tsc --noEmit`. Playwright runs TypeScript without type-checking, so a type error would otherwise go unnoticed. |
| **Tests (shard N/4)** | `npm ci --ignore-scripts` (npm cache) → Chromium restored from an `actions/cache` keyed on the Playwright version, or downloaded with `playwright install --with-deps chromium` on a cache miss → `npx playwright test --shard=N/4`. Every shard is a separate VM with 2 workers. `fail-fast: false`, so one red shard does not cancel the others. |
| **Merge reports** | Downloads the four blob reports and runs `playwright merge-reports` ([`merge.config.ts`](merge.config.ts)) into one HTML report, one JUnit XML and one JSON file. [`scripts/ci-summary.mjs`](scripts/ci-summary.mjs) writes the failed and flaky tests, with `file:line` and the error, to the run's summary page. |
| **CI gate** | Green only if Typecheck and every shard succeeded. This is the one check to mark as required in branch protection (Settings → Branches → `main` → *Require status checks* → `CI gate`), so the rule does not need to change when the number of shards changes. |

The workflow uses no secrets, a read-only token and no local paths: the tests run against the public site and create their own data, so a fork goes green without any change. (GitHub disables workflows in a new fork until you click *"I understand my workflows, go ahead and enable them"* on the fork's **Actions** tab; after that, every push runs the pipeline.)

### CI-specific configuration ([`playwright.config.ts`](playwright.config.ts), when `CI` is set)

| Setting | CI | Local | Why |
|---|---|---|---|
| `forbidOnly` | `true` | `false` | A forgotten `test.only` would run one test and report green. On CI it fails the run. |
| `retries` | `1` | `0` | The public site resets its database from time to time (users and product ids disappear). One retry absorbs that; a test that needs the retry is marked **flaky** in the report, so it is visible, not hidden. More retries would only make a real failure slower to report. |
| `workers` | `2` | `4` | Matches the 2-4 vCPU of a GitHub-hosted runner and keeps the load on the shared public site reasonable. |
| reporters | `list`, `github`, `blob`, `junit` (`reports/junit.xml`), `html` | `list`, `html` | `github` puts the error as an annotation on the failing line of the PR diff; `blob` is merged across shards; `junit` is the machine-readable result. |
| `trace` / `video` / `screenshot` | `retain-on-failure` / `retain-on-failure` / `on` | same | Every failed attempt (first try *and* retry) keeps a trace, a video and a screenshot. |

### Artefacts (kept 14 days, blob reports 7 days)

| Artifact | Contents |
|---|---|
| `playwright-report` | Merged HTML report of all shards. Open `index.html` (or `npx playwright show-report playwright-report`): every failed test with its error, the expected vs. received value, the screenshot, the video and the **trace** (click it to open the trace viewer). |
| `junit-report` | Merged `junit.xml` of the whole run. |
| `shard-N-results` | Per shard: its own HTML report, `reports/junit.xml`, and `test-results/` with the raw `trace.zip`, `video.webm`, `test-failed-1.png` and `error-context.md` of every failed attempt (`npx playwright show-trace trace.zip`). |
| `blob-report-N` | Raw input for the merge (7 days). |

### How to read a red run

1. The run's **Summary** page lists each failed test, its file and line, the number of attempts, and the first lines of the error (for example `Expected: "Wrong password"` / `Received: "Invalid email or password"` / locator `getByTestId('login-error')`). The PR diff has the same error as an annotation on the failing line.
2. For the *why*, download `playwright-report`, open `index.html`, click the failed test: screenshot of the final state, video, and the trace with every action, network call and the DOM before and after each step.

I checked this by breaking one expected message on purpose: the summary, the annotation and both attempts' traces pointed straight at `tests/login.spec.ts:19` and the wrong text.

### What blocks a merge, what only reports, and why

**Blocks the merge (part of `CI gate`):**

- **Typecheck fails.** A type error is a bug in our code, it is deterministic, and it costs 30 seconds to find. There is no reason to let it in.
- **A test fails on both attempts.** The suite is the product of this repository. A test that fails twice means either the application changed its behaviour (which the test exists to catch) or the test is broken. Both need a human before the code goes to `main`.
- **A committed `test.only`** (`forbidOnly`). It would turn the suite into one test and report green: a false pass is worse than a red build.

**Only reports (visible, never blocks):**

- **Flaky tests** (failed, then passed on retry). They are listed under "Flaky" in the summary and marked in the HTML report. The usual cause here is outside our code (the shared site's database reset or another visitor changing stock), so blocking a merge for it would punish the author for something they cannot fix, and people learn to press "re-run" without reading. Reporting it keeps the signal: if the same test shows up as flaky again and again, that is a bug to fix in the test.
- **Merging the report** (`Merge reports` job). It is not in the gate: if the artifact service hiccups, the code is not wrong. The tests have already given their verdict.
- **Known application bugs** (the `known bug` annotation on the reset-password test, the bugs in [Description.md](Description.md)). They are documented behaviour; the tests assert the current behaviour and will go red when it changes, which is the moment someone has to look.

**Why the line is there:** a check blocks when a failure is *deterministic and caused by the change being merged* (type errors, a test that fails twice, `test.only`). It only reports when a failure is *probably caused by the environment* (one failed attempt on a shared public site) or is about the reporting itself. Gating everything (including flakes) would make the pipeline red for reasons nobody can act on, and people would stop trusting it; gating nothing would let a real regression reach `main`. The honest weak point: the suite depends on a public site I do not control. If the site is down, the gate is red and the merge waits; I accept that, because a green gate that cannot see the application would be a lie, and re-running the workflow once the site is back is cheap.

### Parallelism: runtime before and after

The 8 tests are split over **4 shards** (4 parallel jobs × 2 workers each) with `--shard=N/4`, and the reports are merged afterwards.

RUNTIME_TABLE_PLACEHOLDER

To reproduce the baseline: Actions → *Playwright Tests* → *Run workflow* → shards `1`.
