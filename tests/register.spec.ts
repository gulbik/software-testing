import { createUser, fullName } from '../src/data/testData';
import { Messages } from '../src/data/messages';
import { expect, test } from '../src/fixtures/test';

test.describe('Register a new customer', () => {
  test('creates a new unique account that can sign in', async ({ page, registerPage, loginPage, accountPage, header }) => {
    const user = createUser();

    await registerPage.goto();
    await registerPage.register(user);

    await expect(page).toHaveURL(loginPage.url);

    await loginPage.login(user.email, user.password);
    await expect(page).toHaveURL(accountPage.url);
    await expect(accountPage.title).toHaveText(Messages.accountTitle);
    await expect(header.userMenu).toContainText(fullName(user));
  });

  test('rejects an email address that is already registered', async ({ page, registeredUser, registerPage }) => {
    await registerPage.goto();
    await registerPage.register({ ...createUser(), email: registeredUser.email });

    await expect(registerPage.registerError).toHaveText(Messages.duplicateEmail);
    await expect(page).toHaveURL(registerPage.url);
  });
});
