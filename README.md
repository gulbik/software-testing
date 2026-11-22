# Toolshop Playwright tests

Automated UI tests with **Playwright + TypeScript** for <https://practicesoftwaretesting.com/> (Toolshop v5.0): register, log in, buy a product, compare products, reset a password.

| Document | Contents |
|---|---|
| [Description.md](Description.md) | Goal, the test cases (TC-01 … TC-08), bugs found in the application |
| [Prompt.md](Prompt.md) | The exact prompts given to the AI tool, and which tool and model were used |
| [Review.md](Review.md) | What the AI produced, how it was reviewed and changed, and why |
| [CI](#ci) | The CI pipeline (SIS 3) |

## Requirements

- Node.js (tested with Node.js 22) and npm
- Internet access (locally the tests run against the public site and its API; CI runs its own copy, see below)

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
.github/workflows/          CI pipeline (GitHub Actions)
merge.config.ts             reporters for merging the CI shards' reports
scripts/                    CI helpers: start Toolshop in Docker and wait until it is ready
```

## Reports and evidence

- `playwright-report/`: HTML report (`npm run report`). A **screenshot of every test's final state** is attached (account page, order confirmation, comparison table, …).
- `test-results/`: for failed tests, the screenshot, **trace** (`npx playwright show-trace <path>/trace.zip`) and video.
- On CI, failed tests are retried up to twice (see [CI](#ci)).

## CI

[![Playwright Tests](https://github.com/gulbik/software-testing/actions/workflows/playwright.yml/badge.svg?branch=main)](https://github.com/gulbik/software-testing/actions/workflows/playwright.yml)

**CI system:** GitHub Actions. It is built into GitHub, where the repository already lives, needs no server of its own, is free for public repositories and supports matrices for sharding.

**Pipeline** (`.github/workflows/playwright.yml`):
- runs on every push and pull request;
- `npm ci` with the npm cache, Chromium installed with system dependencies;
- the full Playwright suite split into 4 shards (`--shard=i/4`) running in parallel;
- the `merge-reports` job merges the shards' blob reports into one HTML report and JUnit;
- artefacts: `playwright-report` (HTML), `test-results-N` (traces, screenshots, videos, JUnit), `junit-report`; kept for 14 days.

**Application under test in CI:** the public site blocks GitHub runners with a Cloudflare bot check, so each shard starts the open-source Toolshop app in Docker (the same version as the public site) and runs the tests against it through `BASE_URL` and `API_URL`. Locally the tests use the public site.

**CI settings** (`playwright.config.ts`, when `CI=true`): `forbidOnly: true`, `retries: 2`, reporters `list`, `blob`, `junit`, `trace: 'on-first-retry'`.

**What blocks a merge:** a test that fails all 3 attempts, or a committed `test.only`. Both are caused by the change itself. **What only reports:** flaky tests (failed, then passed on a retry) and the `merge-reports` job. A flaky test is usually timing, not the author's change, and blocking on it would teach people to re-run without reading.

### Runtime

| Configuration | Total run time | Run tests step (slowest shard) | Run |
| --- | --- | --- | --- |
| 1 job, no sharding | 3 min 42 s | 12 s | [run](https://github.com/gulbik/software-testing/actions/runs/44946184776) |
| 4 shards + merge | 4 min 59 s | 7 s | [run](https://github.com/gulbik/software-testing/actions/runs/44946181242) |

Median of 3 runs (a push and two re-runs). Conclusion: sharding cuts the test step from 12 s to 7 s, but the whole run is slower, because every shard spends about 3 minutes starting Toolshop in Docker; with 8 tests one job is enough, and sharding pays off for a larger suite.

### Running locally

    npm ci
    npx playwright install --with-deps chromium
    CI=true npx playwright test
