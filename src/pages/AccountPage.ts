import { Locator, Page } from '@playwright/test';

export class AccountPage {
  readonly url = /\/account$/;
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('page-title');
  }

  async goto(): Promise<void> {
    await this.page.goto('/account');
  }
}
