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
.github/workflows/          CI pipeline (GitHub Actions), see "Continuous integration" below
merge.config.ts             reporters for merging the CI shards' reports
scripts/                    CI helpers: start/wait for Toolshop in Docker, job summary
```

## Reports and evidence

- `playwright-report/`: HTML report (`npm run report`). A **screenshot of every test's final state** is attached (account page, order confirmation, comparison table, …).
- `test-results/`: for failed tests, the screenshot, **trace** (`npx playwright show-trace <path>/trace.zip`) and video.
- On CI, failed tests are retried once (see [CI-specific configuration](#ci-specific-configuration-playwrightconfigts-when-ci-is-set)).

## Continuous integration (SIS 3)

**Platform: GitHub Actions.** The code already lives on GitHub, so Actions needs no extra server and no account: anyone who forks the repository gets the same pipeline and the same free runners. GitLab CI would need the repository mirrored, and Jenkins in Docker would need the grader to start and configure a Jenkins container first; both add a step between "fork" and "green" without testing anything more.

Workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml). It runs on **every push to any branch, every pull request**, and manually (`workflow_dispatch`).

### The application under test in CI

The first CI run tested the public site, like a local run does, and 5 of 8 tests failed. The screenshots in the artefacts showed why: practicesoftwaretesting.com sits behind **Cloudflare, which answers GitHub-hosted runners with a "Verify you are human" page** after the first few requests. That is not something a test suite should try to get around, and it would make the grade depend on Cloudflare's mood.

So **CI tests its own copy of the same application.** Toolshop is open source ([testsmith-io/practice-software-testing](https://github.com/testsmith-io/practice-software-testing)); every test job checks it out, pinned to commit `ae7caec` (the version the public site runs: "v2.5, built 2026-10-11"), and starts it with Docker Compose next to the tests ([`scripts/toolshop-start.sh`](scripts/toolshop-start.sh), [`scripts/toolshop-wait.sh`](scripts/toolshop-wait.sh)). The tests already read `BASE_URL` and `API_URL`, so in CI they point at `http://localhost:4200` and `http://localhost:8091`; no test changed. Locally, `npx playwright test` still tests the public site.

What this buys besides "it runs": every job gets a **freshly seeded database**, so the public site's random database resets and other visitors changing stock can no longer turn a run red; and the version under test only changes when someone changes the pinned commit, in a reviewed PR.

### What the pipeline does

```
push / pull_request
 ├─ Typecheck ──────────────────────────────────────────┐
 ├─ Tests (shard 1/4) ─┐                                 │
 ├─ Tests (shard 2/4) ─┤─► Merge reports (HTML, JUnit,   ├─► CI gate  ← required check
 ├─ Tests (shard 3/4) ─┤   job summary) — reports only   │
 └─ Tests (shard 4/4) ─┘──────────────────────────────────┘
```

| Job | Steps |
|---|---|
| **Typecheck** | `npm ci --ignore-scripts` (npm cache from `actions/setup-node`, keyed on `package-lock.json`), `tsc --noEmit`. Playwright runs TypeScript without type-checking, so a type error would otherwise go unnoticed. |
| **Tests (shard N/4)** | Check out Toolshop and start it in Docker → `npm ci --ignore-scripts` (npm cache) → Chromium restored from `actions/cache` (key: Playwright version) or `playwright install --with-deps chromium` on a cache miss → wait until the database is seeded and the API and UI answer → `npx playwright test --shard=N/4` (2 workers). `fail-fast: false`, so one red shard does not cancel the others. On failure, the Docker logs are saved too. |
| **Merge reports** | Downloads the four blob reports and runs `playwright merge-reports` ([`merge.config.ts`](merge.config.ts)) into one HTML report, one JUnit XML and one JSON file. [`scripts/ci-summary.mjs`](scripts/ci-summary.mjs) writes the failed and flaky tests, with `file:line` and the error, to the run's summary page. |
| **CI gate** | Green only if Typecheck and every shard succeeded. This is the one check to mark as required in branch protection (Settings → Branches → `main` → *Require status checks* → `CI gate`), so the rule does not change when the number of shards changes. |

The workflow uses **no secrets**, a read-only token and no local paths, so a fork goes green without any change. (GitHub disables workflows in a new fork until you click *"I understand my workflows, go ahead and enable them"* on the fork's **Actions** tab; after that, every push runs the pipeline.)

### CI-specific configuration ([`playwright.config.ts`](playwright.config.ts), when `CI` is set)

| Setting | CI | Local | Why |
|---|---|---|---|
| `forbidOnly` | `true` | `false` | A forgotten `test.only` would run one test and report green. On CI it fails the run. |
| `retries` | `1` | `0` | One retry absorbs a one-off hiccup (a container that is still warming up, a slow first page compile). A test that needs the retry is marked **flaky** in the report, so it is visible, not hidden. More retries would only make a real failure slower to report. |
| `workers` | `2` | `4` | Matches the vCPUs of a GitHub-hosted runner, which also runs the Toolshop containers. |
| reporters | `list`, `github`, `blob`, `junit` (`reports/junit.xml`), `html` | `list`, `html` | `github` puts the error as an annotation on the failing line of the PR diff; `blob` is merged across shards; `junit` is the machine-readable result. |
| `trace` / `video` / `screenshot` | `retain-on-failure` / `retain-on-failure` / `on` | same | Every failed attempt (first try *and* retry) keeps a trace, a video and a screenshot. |

### Artefacts (kept 14 days, blob reports 7 days)

| Artifact | Contents |
|---|---|
| `playwright-report` | Merged HTML report of all shards. Open `index.html` (or `npx playwright show-report playwright-report`): every failed test with its error, the expected vs. received value, the screenshot, the video and the **trace** (click it to open the trace viewer). |
| `junit-report` | Merged `junit.xml` of the whole run. |
| `shard-N-results` | Per shard: its own HTML report, `reports/junit.xml`, `test-results/` with the raw `trace.zip`, `video.webm`, `test-failed-1.png` and `error-context.md` of every failed attempt (`npx playwright show-trace trace.zip`), and `toolshop-docker.log` when the shard failed. |
| `blob-report-N` | Raw input for the merge (7 days). |

### How to read a red run

1. The run's **Summary** page lists each failed test, its file and line, the number of attempts, and the first lines of the error (for example `Expected: "Wrong password"` / `Received: "Invalid email or password"` / locator `getByTestId('login-error')`). The PR diff has the same error as an annotation on the failing line.
2. For the *why*, download `playwright-report`, open `index.html`, click the failed test: screenshot of the final state, video, and the trace with every action, network call and the DOM before and after each step.
3. If the application itself misbehaved, `toolshop-docker.log` in `shard-N-results` has the API and web-server logs.

This is not theoretical. I broke one expected message on purpose, and the summary, the annotation and both attempts' traces pointed straight at `tests/login.spec.ts:19` and the wrong text. While building the pipeline, the artefacts alone also explained two real red runs: the screenshots showed the Cloudflare page, and a trace of the API call showed Laravel's `500 tempnam(): file created in the system's temporary directory` (the API container could not write to `storage/`; fixed in `toolshop-start.sh`).

### What blocks a merge, what only reports, and why

**Blocks the merge (part of `CI gate`):**

- **Typecheck fails.** A type error is a bug in our code, it is deterministic, and it costs 10 seconds to find. There is no reason to let it in.
- **A test fails on both attempts.** The suite is the product of this repository. A test that fails twice against a freshly seeded, pinned copy of the application means the change broke a test, a page object or the test data, which is exactly what review should stop.
- **A committed `test.only`** (`forbidOnly`). It would turn the suite into one test and report green: a false pass is worse than a red build.
- **The application cannot be started** (the Toolshop wait step fails). Then no test ran, and "nothing was checked" must never look like "everything passed".

**Only reports (visible, never blocks):**

- **Flaky tests** (failed, then passed on retry). They are listed under "Flaky" in the summary and marked in the HTML report. One failed attempt is usually timing (containers still warming up), not the change under review; blocking on it would punish the author for something they did not do, and people would learn to press "re-run" without reading. Reporting keeps the signal: a test that is flaky again and again is a bug to fix in the test.
- **Merging the report** (`Merge reports` job). It is not in the gate: if the artifact service hiccups, the code is not wrong, and the shards have already given their verdict. Each shard also uploads its own report, so the evidence survives a failed merge.
- **Known application bugs** (the `known bug` annotation on the reset-password test, the bugs in [Description.md](Description.md)). They are documented behaviour of the application, not of our change. The tests assert the current behaviour and go red when it changes, which is the moment someone has to look.

**Why the line is there:** a check blocks when its failure is *deterministic and caused by the change being merged*: type errors, a test that fails twice against a pinned, freshly seeded app, `test.only`, or no tests having run at all. It only reports when a failure is *probably not caused by the change* (one failed attempt) or concerns only the reporting. Gating flakes too would make the pipeline red for reasons nobody can act on, and people would stop trusting it; gating nothing would let a real regression reach `main`. Testing a pinned copy of the application instead of the public site is what makes this line defensible: a red gate can no longer mean "Cloudflare" or "someone reset the database".

### Parallelism: runtime before and after

The 8 tests are split over **4 shards**, 4 parallel jobs with 2 workers each (`--shard=N/4`), and the reports are merged afterwards. Both runs below are the same commit on GitHub-hosted `ubuntu-latest` runners; the baseline used one job (`--shard=1/1`).

| | Before: 1 job (`--shard=1/1`) | After: 4 shards (`--shard=N/4`) |
|---|---|---|
| Run | [#44943492056](https://github.com/gulbik/software-testing/actions/runs/44943492056) | [#44942660204](https://github.com/gulbik/software-testing/actions/runs/44942660204) |
| `Run Playwright tests` step | **11 s** (8 tests) | **6–8 s** per shard (2 tests each), in parallel |
| Start Toolshop (Docker build + start) | 2 min 14 s | 3 min 6 s – 3 min 33 s per shard |
| Slowest test job | 3 min 21 s | 4 min 39 s |
| **Whole workflow (push → last job done)** | **3 min 42 s** | **5 min 00 s** |

**What this shows, honestly:** sharding does what it should to the test step (11 s → at most 8 s; with only 8 fast tests against a local app there is little to split). But the wall-clock time got *worse*, because about 90 % of every test job is building and starting the Toolshop containers, and each shard has to do that itself. Four jobs building Docker images at the same time were also slower than one (3+ min vs 2 min 14 s). These are single runs, so expect ±30 s of noise, but the shape is clear.

**Conclusion:** for this suite, one job is faster. I keep 4 shards because the assignment asks to demonstrate parallelism, and because the setup cost is fixed while the test time grows with the suite: the earlier serial run against the public site took 37.5 s for the same 8 tests, and a suite of a few hundred such tests would make sharding pay off. The next optimisation would be to build the Toolshop images once in a separate job (or use prebuilt images) and share them with all shards, which removes most of the per-shard cost. (The Chromium cache hit no run above: GitHub scopes caches to a branch and `main`, and each run was the first on its branch. After the merge, runs reuse the `main` cache and save ~20 s per job.)

To reproduce the baseline once this is on `main`: Actions → *Playwright Tests* → *Run workflow* → shards `1`.
