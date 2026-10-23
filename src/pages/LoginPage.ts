import { Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly url = /\/auth\/login$/;
  readonly errorMessage: Locator;
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.errorMessage = page.getByTestId('login-error');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submitButton = page.getByTestId('login-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submitButton.click();
  }
}
