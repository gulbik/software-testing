# Review of the AI-generated work

## Step 1: Website analysis

The first step was to understand how the application actually works instead of relying on tutorials or assumed selectors.

Playwright was installed in a separate scratch folder outside the project. The AI then checked the live site and:

- collected the `data-test` attributes on the main pages;
- went through registration, login, checkout, compare and password reset;
- checked the API requests and responses used by these flows.

Some useful things were found during this analysis:

- The public demo accounts (`customer@...` and `customer2@...`) were not reliable test accounts. One was locked with "too many failed attempts", and the other only worked because the database had just been reset.
- Password reset changes the password to `welcome02` immediately (known bug 1).
- The reset success message is displayed as the raw i18n key `page.forgot-password.confirm` (known bug 2).
- Product stock can change while testing, and the database resets can also change product IDs.

I also checked the analysis myself against the live site. I found the following problems:

1. **Password rules were incomplete.** The AI used the validation message saying that the password must have at least 6 characters. However, the help text on the page requires 8 or more characters, upper and lower case letters, a number and a symbol. The API also rejects passwords that appear in known data leaks.

2. **Guest checkout was missed.** The analysis said that checkout only offered sign-in. There is also a "Continue as Guest" tab. It has no `data-test` attribute, so it was missed by the initial scan. This also showed that checking `data-test` attributes is not enough to fully understand a page.

3. **The cart badge stays after an order.** In my manual guest checkout, `cart-quantity` still showed `1` after the order was completed.

4. **The Compare flow was misunderstood.** The site already has its own Compare feature, including compare buttons, a comparison bar and a `/comparison` page with a comparison table. The required check should compare the actual product information, not just values already taken from the same table. With the products sorted by price low to high, the cheaper product should be first.

### Decisions from the analysis

| Question | Decision | Reason |
|---|---|---|
| Reset success text | Assert the literal key `page.forgot-password.confirm` | This documents the current behaviour and will fail when the bug is fixed. The test is marked as a known bug. |
| Malformed email on reset | Bug report only, no test | The assignment asks for a known email and an invalid one. An unregistered email is enough for this case. |
| Test users | Create users through `POST /users/register` | This is faster and keeps each UI test focused on its own flow. Registration through the UI is still covered by TC-01 and TC-02. |
| Registration proof | Two separate tests | One test checks a new account and the other checks duplicate email, so failures are easier to understand. |
| Buy | Guest checkout, Cash on Delivery, quantity 2 | This avoids account lockout issues. Quantity 2 also checks the quantity and price calculation. |
| Compare | Use the application's Compare feature | This tests the actual application feature rather than reproducing it in the test. |
| Browser | Chromium only | This matches the assignment scope. |
| Branch | `main` | This matches the assignment scope. |

---

## Step 2: Architecture

The proposed structure uses page objects in `src/pages`, test files in `tests/`, shared components and a custom fixture.

The fixture creates a new customer for each test. This was important because password reset changes the password and failed login attempts can lock an account. Sharing one user between tests would make the tests depend on each other.

The configuration also uses:

- `fullyParallel`;
- `testIdAttribute: 'data-test'`;
- a `postinstall` step that installs the Chromium browser.

I accepted this structure after reviewing the open questions.

### Seeded accounts

I decided not to use the seeded customer accounts from the website.

`customer@...` was already locked with a 423 response. `customer2@...` worked only because the database had recently been reset, and the account can be locked again by another person using the public site.

Using these accounts would make the tests fail for reasons unrelated to the test itself. This is documented in `Description.md`.

---

## Step 3: Implementation

The implementation contains:

- 8 page objects;
- 2 shared components;
- a custom fixture;
- an API helper;
- test data and message files;
- Playwright configuration;
- 5 spec files with 8 tests.

I verified the implementation in several ways.

### Normal run

All 8 tests passed.

### Parallel run

I ran:

```text
--repeat-each=3 --workers=4
```

and all 24 tests passed.

### Clean clone

I tested the project from a fresh copy without `node_modules`. `npm install` completed successfully and the Playwright test suite also ran successfully.

### Checking the assertions

I did not rely only on a green test run. I intentionally changed the expected values used by the tests, including headings, error messages, quantity and product order.

Each changed assertion caused the corresponding test to fail. This gave me more confidence that the tests were actually checking the expected behaviour.

### Forbidden patterns

I also searched the project and found no:

- `waitForTimeout`;
- XPath locators;
- CSS-class selectors;
- locators inside spec files.

---

## Step 4: Review of the tests

I did a separate review of the tests against the assignment requirements, with particular attention to assertions that could pass without actually checking the required behaviour.

The following issues were identified during the review:

| Finding | Problem | Fix |
|---|---|---|
| M1 — Compare | The comparison was comparing the table's prices with values taken from the same table, so the assertion could not really fail | Products are selected and sorted from the API. Their names and prices are captured first, and the comparison table must show the same products with the cheaper product first |
| M2 — User names | Every test user was named `Qa Tester`, so the test could not prove that the correct user was signed in | Each generated user now has a unique last name |
| M3 — Invalid login | The "not signed in" check was already true before the login attempt | After the failed login, `/account` must redirect to the login page |
| M4 — Cart | Extra or duplicate products in the cart would not be detected | The cart must contain exactly the expected product |
| M5 — Buy | The test always used the same product. A stock change could therefore cause an unrelated failure | The test selects a random in-stock product and checks that "Add to cart" is enabled |
| M6 — Clean clone | The clean-clone check had only been done on macOS, and the lockfile was not tracked | Linux/CI instructions were documented and the lockfile is included |

I also removed a few unnecessary checks and made some smaller improvements:

- removed no-op assertions;
- improved the address lookup wait;
- made the confirmation locator less dependent on the exact text;
- added a typecheck to CI;
- cleaned up the repository.

### Additional changes I requested

I also added two things that I considered important:

**Faker**

Faker is used for test data such as names, date of birth and phone numbers. This prevents the tests from using the same values every time.

**Password reset verification**

After the password reset, the test signs in using `welcome02`.

Checking only the success message would prove what the UI displays, but not that the server actually changed the password. Successful login with the new password checks the actual behaviour.

---

## Step 5: Fixes and verification

The fixes revealed one real issue that was hidden by the original buy test.

The original test always used the same product. After changing it to select a random in-stock product, the test failed 3 times out of 30.

The reason was the application's rule:

> "You can only have one Thor Hammer in the cart."

The API returns 400 when quantity 2 is requested for this product.

This is an application business rule, not a flaky test. I therefore excluded these products using a named and documented `singleUnitProducts` list instead of adding retries or hiding the failure.

### `page.waitForResponse` in `AddressForm`

This is used to wait for the actual postcode lookup response rather than a fixed delay. The lookup changes the street, city and state fields, so the test waits for the real response and then uses web-first assertions on the fields.

---

# SIS 3: Review of the AI-generated CI pipeline

## What the AI produced

- `.github/workflows/playwright.yml`: typecheck job, 4 test shards, a merge-reports job, and a `CI gate` job to use as the single required check.
- CI-specific settings in `playwright.config.ts` (`forbidOnly`, 1 retry, `github` + `blob` + `junit` + `html` reporters) and `merge.config.ts` for the merged report.
- `scripts/ci-summary.mjs`: writes failed and flaky tests, with `file:line` and the error, to the GitHub job summary.
- `scripts/toolshop-start.sh` / `toolshop-wait.sh`: start the Toolshop application in Docker inside each job.
- The CI section of the README.

## Checks before trusting it

| Check | Result |
|---|---|
| The suite with CI settings, locally (`CI=1`, 1 worker) | 8 passed in 37.5 s |
| Shards + merge + summary, simulated locally | 4 blob reports merged into one HTML/JUnit/JSON report; summary correct |
| **Red run:** I changed the expected login error to `'Wrong password'` | The summary named `tests/login.spec.ts:19`, showed `Expected: "Wrong password"` / `Received: "Invalid email or password"`; both attempts kept a trace, video and screenshot. Change reverted. |
| Action versions | Checked against the actual latest releases (`checkout@v7`, `setup-node@v7`, `cache@v6`, `upload-artifact@v7`, `download-artifact@v8`), not written from memory |

## What went wrong, and how it was fixed

| # | Problem | How it was found | Decision |
|---|---|---|---|
| 1 | **The plan assumed CI could test the public site.** First CI run: 5 of 8 tests red, although all were green locally. | The `test-failed-1.png` screenshots in the artefacts: a Cloudflare "Verify you are human" page. GitHub's datacenter IPs get a bot check after a few requests. | Not worked around: bypassing bot protection is not acceptable, and it would be fragile anyway. CI now starts its own copy of the open-source Toolshop in Docker, pinned to a commit, and points `BASE_URL`/`API_URL` at it. The tests themselves did not change. |
| 2 | The AI first suspected the pinned upstream commit was **newer than the public site** (the header looked different in the failure snapshot). | The AI checked before acting on it: it read the public site's footer, `v2.5 \| Built 2026-10-11`, the same date as the pinned commit. The hypothesis was wrong. | Kept the pin; looked for the real cause instead. |
| 3 | Self-hosted API answered **500** on `/products`; the header did not show the signed-in user. | The trace of the API call contained Laravel's error page: `tempnam(): file created in the system's temporary directory`. | The API code is bind-mounted from the checkout, owned by the runner user, while PHP runs as `www-data`. `toolshop-start.sh` makes `storage/` and `bootstrap/cache` writable. Next run: all green. |
| 4 | **Branch name `claude/sis3-ci-pipeline-dfdd1e`.** | My correction (Prompt 8): the prefix and the random suffix came from the tool's worktree default and mean nothing in this repository. | Renamed to `sis3-ci-pipeline`; the old remote branch was deleted. |
| 5 | **The AI went silent for minutes** while waiting for CI. | My question "почему ты застрял?" (Prompt 8). | Long CI waits now run in the background with a short status line. |
| 6 | The first draft of the README argued that flaky tests come from the public site's database resets. | After point 1, CI no longer touches the public site, so that argument was out of date. | The gating section was rewritten around the pinned, freshly seeded application (see README). |

## Decisions proposed by the AI (to be checked and confirmed by me)

- **GitHub Actions** over GitLab/Jenkins: the grader forks on GitHub, so nothing extra has to run.
- **What blocks and what only reports** (README, "What blocks a merge"): type errors, a test that fails twice, `test.only` and an application that does not start block; flaky tests, the report merge job and known application bugs only report.
- **One retry, not two:** enough for a one-off hiccup; more retries would make a real failure slower to report.
- **Being honest about sharding:** most of the job time is starting Toolshop, not running tests, and the README says so with the measured numbers.
