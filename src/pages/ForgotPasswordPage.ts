import { Locator, Page } from '@playwright/test';

export class ForgotPasswordPage {
  readonly resultAlert: Locator;
  private readonly email: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    const form = page.getByTestId('forgot-password-form');
    this.resultAlert = form.getByRole('alert');
    this.email = form.getByTestId('email');
    this.submitButton = form.getByTestId('forgot-password-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/forgot-password');
  }

  async requestReset(email: string): Promise<void> {
    await this.email.fill(email);
    await this.submitButton.click();
  }
}
