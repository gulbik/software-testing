import { fullName, generatePassword } from '../src/data/testData';
import { Messages } from '../src/data/messages';
import { expect, test } from '../src/fixtures/test';

test.describe('Log in', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('valid credentials open the account page', async ({ page, registeredUser, loginPage, accountPage, header }) => {
    await loginPage.login(registeredUser.email, registeredUser.password);

    await expect(page).toHaveURL(accountPage.url);
    await expect(accountPage.title).toHaveText(Messages.accountTitle);
    await expect(header.userMenu).toContainText(fullName(registeredUser));
    await expect(header.signInLink).toBeHidden();
  });

  test('invalid credentials show an error and do not sign in', async ({ page, registeredUser, loginPage, accountPage, header }) => {
    await loginPage.login(registeredUser.email, generatePassword());

    await expect(loginPage.errorMessage).toHaveText(Messages.invalidLogin);
    await expect(header.userMenu).toBeHidden();

    await accountPage.goto();
    await expect(page).toHaveURL(loginPage.url);
    await expect(header.signInLink).toBeVisible();
  });
});
