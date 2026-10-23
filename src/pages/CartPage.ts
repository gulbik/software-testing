import { Locator, Page } from '@playwright/test';

export interface CartRow {
  quantity: Locator;
  unitPrice: Locator;
  linePrice: Locator;
}

export class CartPage {
  readonly productTitles: Locator;
  readonly total: Locator;
  private readonly proceedButton: Locator;

  constructor(private readonly page: Page) {
    this.productTitles = page.getByTestId('product-title');
    this.total = page.getByTestId('cart-total');
    this.proceedButton = page.getByTestId('proceed-1');
  }

  row(productName: string): CartRow {
    const row = this.page
      .getByRole('row')
      .filter({ has: this.productTitles.getByText(productName, { exact: true }) });
    return {
      quantity: row.getByTestId('product-quantity'),
      unitPrice: row.getByTestId('product-price'),
      linePrice: row.getByTestId('line-price'),
    };
  }

  async proceedToCheckout(): Promise<void> {
    await this.proceedButton.click();
  }
}
