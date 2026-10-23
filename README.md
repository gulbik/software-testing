# Toolshop Playwright tests

Automated UI tests with **Playwright + TypeScript** for <https://practicesoftwaretesting.com/> (Toolshop v5.0): register, log in, buy a product, compare products, reset a password.

| Document | Contents |
|---|---|
| [Description.md](Description.md) | Goal, the test cases (TC-01 … TC-08), bugs found in the application |
| [Prompt.md](Prompt.md) | The exact prompts given to the AI tool, and which tool and model were used |
| [Review.md](Review.md) | What the AI produced, how it was reviewed and changed, and why |

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
