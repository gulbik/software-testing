import { Locator, Page } from '@playwright/test';

export class ComparisonPage {
  readonly url = /\/comparison$/;
  readonly productNames: Locator;
  readonly prices: Locator;

  constructor(page: Page) {
    const table = page.getByTestId('comparison-table');
    this.productNames = table.getByTestId('product-name');
    this.prices = table.getByTestId('compare-price');
  }
}
