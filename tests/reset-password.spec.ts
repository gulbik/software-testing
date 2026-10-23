import { fullName, passwordAfterReset, uniqueEmail } from '../src/data/testData';
import { Messages } from '../src/data/messages';
import { expect, test } from '../src/fixtures/test';

test.describe('Reset a password', () => {
  test.beforeEach(async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.goto();
  });

  test('a known email gets the reset confirmation and the new password works', async ({ page, registeredUser, forgotPasswordPage, loginPage, accountPage, header }) => {
    test.info().annotations.push({
      type: 'known bug',
      description: 'The success alert shows the untranslated key "page.forgot-password.confirm" (Description.md, bug 2).',
    });

    await forgotPasswordPage.requestReset(registeredUser.email);
    await expect(forgotPasswordPage.resultAlert).toHaveText(Messages.passwordResetConfirmation);

    await loginPage.goto();
    await loginPage.login(registeredUser.email, passwordAfterReset);
    await expect(page).toHaveURL(accountPage.url);
    await expect(header.userMenu).toContainText(fullName(registeredUser));
  });

  test('an unregistered email gets an error', async ({ forgotPasswordPage }) => {
    await forgotPasswordPage.requestReset(uniqueEmail('unknown'));

    await expect(forgotPasswordPage.resultAlert).toHaveText(Messages.unknownEmail);
  });
});
