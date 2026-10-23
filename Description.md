# Description

## What I want to do

Build a reliable, maintainable UI test suite with **Playwright + TypeScript** for the Toolshop demo shop at <https://practicesoftwaretesting.com/> (version **v5.0**, inspected on 2026-10-22). It covers five business flows:

1. Register a new customer
2. Log in (valid and invalid credentials)
3. Buy a product (add to cart → cart contents → checkout)
4. Compare two products
5. Reset a password

The suite must be trustworthy, not just green:

- **Independent tests:** every test creates the data it needs (a new customer through the API, products looked up at runtime). No test relies on another test, on run order or on pre-existing accounts.
- **Parallel-safe:** unique data per test, a separate browser context per test, and no shared state.
- **Assertions that can fail:** each test checks what the application actually did (account page and user name, error texts, cart contents and totals, order confirmation, the new password working), not just that a click or navigation happened. I proved this by breaking every expected value on purpose and watching each test fail.
- **Stable synchronisation:** Page Object Model with `data-test` locators, Playwright web-first assertions, no `waitForTimeout`, no CSS-class or positional XPath locators.

I also recorded every application bug I found while analysing and automating the flows (see [Bugs found](#bugs-found)).

**Out of scope:** browsers other than Chromium, mobile viewports, the admin area, payment methods other than Cash on Delivery, and the signed-in checkout path (sign-in is covered by the login tests).

## Test cases to be automated

| ID | Assignment flow | Test case | Spec file |
|---|---|---|---|
| TC-01 | Register | Register a new unique customer and sign in with the new account | `tests/register.spec.ts` |
| TC-02 | Register | Registering an email that already exists is rejected | `tests/register.spec.ts` |
| TC-03 | Log in | Valid credentials open the account page | `tests/login.spec.ts` |
| TC-04 | Log in | Invalid credentials show an error and do not sign in | `tests/login.spec.ts` |
| TC-05 | Buy | A guest buys two units of an in-stock product | `tests/buy-product.spec.ts` |
| TC-06 | Compare | Compare two products: name and price of each, cheaper vs. more expensive | `tests/compare-products.spec.ts` |
| TC-07 | Reset password | A known email gets the reset confirmation, and the new password works | `tests/reset-password.spec.ts` |
| TC-08 | Reset password | An unregistered email gets an error | `tests/reset-password.spec.ts` |

### TC-01 Register a new unique customer
- **Data:** a new user generated with Faker (unique email, a random password that meets the rules, a unique last name). Dutch postcode `1011AB` / house number `42`; the site's postcode lookup fills in street, city and state.
- **Steps:**
  1. Open `/auth/register`.
  2. Fill in the form and submit.
  3. Sign in with the new email and password.
- **Expected:**
  - After registering, the browser is on `/auth/login`.
  - After signing in, it is on `/account`, the heading is "My account" and the user menu shows this user's full name.

### TC-02 Duplicate email is rejected
- **Precondition:** a customer registered through the API (`registeredUser` fixture).
- **Steps:** register through the UI with a new generated user but that customer's email.
- **Expected:** "A customer with this email address already exists." is shown and the browser stays on `/auth/register`.

### TC-03 Valid login
- **Precondition:** a customer registered through the API.
- **Steps:**
  1. Open `/auth/login`.
  2. Sign in with the customer's credentials.
- **Expected:** on `/account`; the heading is "My account"; the user menu shows this customer's unique name; the "Sign in" link is gone.

### TC-04 Invalid login
- **Precondition:** a customer registered through the API.
- **Steps:**
  1. Sign in with the customer's email and a wrong password (one attempt, so no shared account can get locked).
  2. Open `/account`.
- **Expected:**
  - After step 1: "Invalid email or password" is shown and no user menu appears.
  - After step 2: the visitor is redirected to `/auth/login` and the "Sign in" link is visible, which proves no session was created.

### TC-05 Guest buys a product
- **Data:** a random in-stock product (from the API, excluding products limited to one per cart); quantity 2; a Faker guest; the Dutch address.
- **Steps:**
  1. Open the product page and set quantity 2.
  2. Add to cart, then open the cart.
  3. Proceed, choose "Continue as Guest", fill in the billing address, pay with Cash on Delivery and confirm.
- **Expected:**
  - The product page shows the expected product and "Add to cart" is enabled.
  - The cart badge shows 2.
  - The cart contains exactly this one product, with quantity 2, the correct unit price, line price = 2 × unit price, and the same total.
  - "Payment was successful" appears.
  - The confirmation reads "Thanks for your order! Your invoice number is INV-…".

### TC-06 Compare two products
- **Data:** two products with different prices, from the API, sorted into *cheaper* and *more expensive*.
- **Steps:**
  1. Open the cheaper product's page, capture its name and price, click "Compare".
  2. Do the same for the more expensive product.
  3. Click "Compare Now".
- **Expected:**
  - Each captured name and price equals the API data.
  - The comparison bar shows "2 product(s) selected".
  - `/comparison` lists the cheaper product first and the more expensive one second, with exactly the captured prices. Stated comparison: the first product is cheaper than the second.

### TC-07 Reset password for a known email
- **Precondition:** a customer registered through the API.
- **Steps:**
  1. Open `/auth/forgot-password` and submit the customer's email.
  2. Sign in with `welcome02`.
- **Expected:**
  - The result alert shows `page.forgot-password.confirm`. This is the text the app currently displays (bug 2); the test is annotated as a known bug.
  - Signing in with `welcome02` reaches `/account` with this customer's name, which proves the reset really happened on the server (bug 1).

### TC-08 Reset password for an unregistered email
- **Steps:** submit a unique, never-registered email on `/auth/forgot-password`.
- **Expected:** the result alert shows "The selected email is invalid."

## Bugs found

| # | Severity | Area | Bug | Steps / evidence |
|---|---|---|---|-|
| 1 | Critical (security) | Forgot password | Requesting a reset **immediately changes the account's password to the fixed value `welcome02`**, with no email link or confirmation. Anyone who knows an email address can reset it and sign in as that user. | `POST /users/forgot-password {email}` → 200, then `POST /users/login` with the old password → 401, with `welcome02` → 200. TC-07 confirms this through the UI. |
| 2 | Medium | Forgot password | The success message shows the untranslated i18n key **`page.forgot-password.confirm`** instead of a sentence. | Submit a registered email on `/auth/forgot-password`. TC-07 asserts this literal key on purpose, so it will fail once the bug is fixed. |
| 3 | Low | Forgot password | An invalid email format (e.g. `bad`) shows an **empty** red error box (`data-test="email-error"` has no text). | Type `bad`, then click "Set New Password". |
| 4 | Low (accessibility) | Forgot password | The success/error alert **disappears by itself after about 3 seconds**, so slow readers or screen-reader users can miss it. | Submit any email and watch the alert under the form. |
| 5 | Medium | Registration | The password error says "Password must be minimal 6 characters long", but the help text and the API require **8+ characters with upper and lower case, a number and a symbol**. | Submit the empty registration form and compare `password-error` with the "Your password must" help text. The API answers `abcdef` with 422 and the stricter rules. |
| 6 | Medium | Cart / checkout | After a successful **guest** checkout, the header cart badge (`data-test="cart-quantity"`) **still shows `1`** although the order completed and the cart was deleted. | |
| 7 | Low | Cart | One "Add to cart" click shows the toast "Product added to shopping cart." **twice**. | Add any product to the cart on its product page. |
| 8 | Medium | Checkout (signed in) | The billing address step **replaces the customer's saved address** with the postcode-lookup result. | User registered with "Main, Ams"; checkout showed "Autarboulevard, Stroe" for the same postcode. |
| 9 | Medium (security) | Login | Accounts lock after repeated failed logins, so **anyone can lock any account** just by knowing its email. The public demo account `customer@…` stays locked this way. | `POST /users/login` with the demo account → 423 "Account locked, too many failed attempts." |
| 10 | Low (accessibility) | Product page | The product page's "Compare" button shows its selected state **only through a CSS class**. It has no `aria-pressed` (the product-card buttons on the home page do have it), and the comparison bar only appears once 2 products are selected, so assistive technology gets no feedback after the first click. | Open a product, click "Compare": only the button's colour changes. |

## Environment notes (not application bugs, but they shape the tests)

- The **database resets periodically.** Product ids are regenerated (old ids return 404), registered users are deleted and invoice numbers restart. Product ids are therefore never hard-coded. A reset in the middle of a run can fail a test; CI uses one retry for this.
- **Stock changes live** because the site is shared ("Pliers" went out of stock during the inspection), so the buy test picks a product that is in stock at runtime.
- **Business rule:** only one Thor Hammer is allowed per cart ("You can only have one Thor Hammer in the cart."; the API answers 400 for quantity 2). The buy test orders 2, so it excludes this product.
- **The seeded demo accounts are not used.** `customer@practicesoftwaretesting.com` was locked ("too many failed attempts") during development, and `customer2@…` was locked earlier the same day. Anyone on the internet can lock them, and a password reset changes their password, so tests that depend on them fail for reasons unrelated to the application.
- Customers cannot delete their own account through the API, so test users are left behind until the next reset.
