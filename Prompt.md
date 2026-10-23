# Prompts

## Tool used


- **Model:** Claude Opus 5.5 (`claude-opus-5-5`) Medium effort

---

## Prompt 1

~~~~text
You are a senior QA and I need to complete a Playwright test automation assignment for the website: https://practicesoftwaretesting.com/

The assignment requires five independent automated tests:

Register a new customer. The test must prove that a unique new account is created and the user ends up signed in or on the login page.
Log in. The test must prove that valid credentials reach the account page, while invalid ones show the error and do not.
Buy a product. The test must prove the whole path works: add to cart → cart shows the right item and quantity → checkout completes.
Compare two products. The test must prove that you can open two products, capture the name and price, and assert the comparison you state.
Reset a password. The test must prove that the forgot-password flow gives the expected confirmation for a known email, and an error for an invalid one.

Each test is independent and creates whatever data it needs. No test may depend on another having run first.

Before writing any code, inspect the actual website and determine how these flows work in the current version of the application.

Important:
- Do not rely on tutorials or previously known selectors.
- Inspect the current website and use the actual current DOM.
- Pay attention to data-test attributes because the project uses them.
- Identify stable locators that do not depend on CSS classes or element position.
- Do not use positional XPath.
- Do not use waitForTimeout.
- Identify where meaningful assertions can be made for each test.
- Identify which tests require unique/generated data.
- Identify any potential problems with running tests independently and in parallel.

Do not generate the final test suite yet.

Instead, provide:
1. A short description of each flow.
2. The important pages involved.
3. Recommended stable locators for each flow.
4. Expected results/assertions for each flow.
5. Test data requirements.
6. Potential synchronization issues and how they should be handled with Playwright web-first assertions.
7. Any risks or ambiguities that should be resolved before implementation.

The goal is to create a reliable test automation project

If you have questions dont make your own decision, ask me
~~~~

## Prompt 2: corrections, answers to the AI's questions, and the architecture design

~~~~text
Data: a unique email on every run, and a password of at least 6 characters. 
actually it stated
Be at least 8 characters long
Contain both uppercase and lowercase letters
Include at least one number
Have at least one special symbol (e.g., @, #, $, etc.)

Checkout has two options Sign in and Continue as Guest. What do you think about Buy a product now? Also After the order, the cart badge doesnt disappear

The site has its own Compare feature. There are compare buttons, a comparison bar and a /comparison page with a full table.

1. Forgot-password success text: should the test (a) check for the success alert and API 200 and note the bug, (b) check for the expected English sentence and let it fail as a
     known bug (test.fail), or (c) check for the literal page.forgot-password.confirm?  c
  2. Malformed email in forgot-password: include the empty email-error case, and if so, as a known-bug check? Or only test the unknown-email case? bug report in the Description.md and only test the unknown-email case
  3. Test setup through the API: may login, buy and forgot-password create their users with POST /users/register? This is my recommendation: it's fast and keeps the UI test focused.
     The alternative is the UI registration form in each test. you can use Post
  4. Proof for "Register": is redirect to login + successful login with the new account enough, or do you also want the duplicate-email check in the same test? do both in different tests
  5. Buy: signed-in user (I found no guest checkout, step 2 only offers login), which payment method (I'd suggest Cash on Delivery), which quantity (I'd suggest 2), and should the
     product be fixed or found in stock at runtime? <li class="nav-item"><a data-bs-toggle="tab" href="#guest-tab" role="tab" class="nav-link">Continue as Guest</a></li> it has guest option. found in stock at runtime
  6. Compare: use the site's Compare feature, or the literal "open two product pages and compare in code"? And which comparison should be stated (for example, price A > price B)? use the site's Compare feature,
  7. Project setup: OK to add @playwright/test to this repo with a standard config (Chromium only, or all browsers?), with tests under tests/? Your repo is on master while the main
     branch is main. Should I work on a new branch? chromium only. main
 
We should write all the bugs found in the app in the Description.md

Based on the website analysis, design the architecture for my Playwright TypeScript test automation project.

The assignment has these mandatory requirements:

- Playwright with TypeScript.
- Page Object Model.
- No locators directly inside spec files.
- At least one custom Playwright fixture.
- Tests must be independent.
- Tests must pass in any order.
- Tests must be safe to run in parallel.
- Generate unique test data where required.
- Every test must contain at least one meaningful assertion that could fail.
- No page.waitForTimeout anywhere.
- No CSS class selectors.
- No positional XPath selectors.
- Prefer stable semantic locators and data-test attributes.
- Use Playwright web-first assertions for synchronization.
- Do not rely on another test having created data.
- The project must work after a clean clone with:
  npm install
  npx playwright test

The five tests are:

1. Register a new customer.
2. Log in with valid credentials and verify invalid login behavior.
3. Buy a product.
4. Compare two products.
5. Reset a password.

Design:
1. Folder structure.
2. Page Object classes and their responsibilities.
3. Fixture(s) and why they are needed.
4. Test files.
5. Test data/utilities.
6. Playwright configuration.
7. How parallel execution will be handled.
8. How screenshots and reports will be generated.

Do not write the complete implementation yet.

First explain the architecture and justify each important decision according to the assignment requirements.
~~~~

## Prompt 3: answers to the architecture questions, and the implementation

~~~~text
guest checkout, 
2 guest  chechout was succesfull but data-test="cart-quantity" was still 1
, yes to rest dont commit yet 
~~~~

followed in the same message by:

~~~~text
Now implement the Playwright TypeScript project based on the previously analyzed website and the proposed architecture.

Implement the five required tests:

1. Register a new customer.
2. Log in with valid credentials and verify invalid login behavior.
3. Buy a product: add to cart → verify the correct product and quantity → complete checkout.
4. Compare two products: open two products, capture their names and prices, and assert a meaningful comparison.
5. Reset a password: verify the expected confirmation for a known email and an error for an invalid email.

Strict requirements:

ARCHITECTURE
- Use Page Object Model.
- No locator may appear directly in a spec file.
- Specs should call methods from Page Objects.
- Use at least one custom Playwright fixture.
- Keep responsibilities separated between pages, fixtures, utilities, and tests.

LOCATORS
- Do not use CSS classes.
- Do not use positional XPath such as (//button)[3].
- Prefer getByRole, getByLabel, getByPlaceholder, getByText, getByTestId, or other stable locators.
- The project uses data-test attributes, and Playwright's testIdAttribute should be configured accordingly.
- Use the actual current DOM of the website rather than selectors from tutorials.

ASSERTIONS
- Every test must contain meaningful assertions.
- Assertions must verify actual application behavior.
- Do not use assertions only to prove that a page loaded.
- For example, verify account page after successful login, validation/error messages after invalid input, correct product and quantity in cart, checkout completion, and password reset responses.
- Assertions must be capable of failing when the application is broken.

SYNCHRONIZATION
- NEVER use page.waitForTimeout.
- Do not add arbitrary delays.
- Use Playwright's auto-waiting and web-first assertions such as expect(...).toBeVisible(), toHaveText(), toHaveValue(), toHaveURL(), etc.

TEST INDEPENDENCE
- Tests must not depend on execution order.
- Tests must be safe to run in parallel.
- Generate unique registration data when required.
- Do not assume that another test has created a user, cart item, or other state.

TEST DATA
- Use the provided seeded account where appropriate:
  customer@practicesoftwaretesting.com / welcome01
  customer2@practicesoftwaretesting.com / welcome01
- Generate unique data for registration.
- Keep test data maintainable and separate from Page Objects.

CODE QUALITY
- Keep the implementation readable and reasonably simple.
- Do not introduce unnecessary abstractions.
- Do not invent functionality that does not exist on the current website.

After generating the implementation, explain:
1. Which files were created.
2. How each requirement from the assignment is satisfied.
3. Which parts of the generated code should be manually reviewed.
4. Any assumptions you made.
~~~~

## Prompt 4: strict code review (no changes yet)

~~~~text
Review the generated Playwright project against the assignment requirements below.

Do not rewrite the project yet. Perform a strict code review.

Requirements:

1. Playwright + TypeScript.
2. Page Object Model is used.
3. No locators inside spec files.
4. At least one fixture is used.
5. Tests are independent.
6. Tests can run in any order.
7. Tests can run in parallel.
8. Unique data is generated where required.
9. Every test has a meaningful assertion that could fail.
10. No waitForTimeout anywhere.
11. No CSS class locators.
12. No positional XPath locators.
13. Synchronization uses Playwright web-first assertions.
14. Tests verify actual application behavior rather than only successful clicks/navigation.
15. The project must run from a clean clone with:
    npm install
    npx playwright test

For every problem you find:
- identify the file and relevant code;
- explain why it violates or potentially violates the requirement;
- classify it as critical, moderate, or minor;
- propose a concrete correction.

Pay special attention to:
- weak assertions;
- hidden dependencies between tests;
- shared state;
- parallel execution problems;
- unstable locators;
- unnecessary waits;
- incorrect Page Object boundaries;
- unnecessary complexity;
- generated test data;
- whether the assertions would actually detect an application bug.

Do not assume that code is correct simply because it runs.
~~~~

## Prompt 5: apply the review fixes

~~~~text
yes, apply all fixes
you can use faker for the data
m8 login with the new password welcome02 to check
~~~~

