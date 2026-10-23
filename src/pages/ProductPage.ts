import { expect, Locator, Page } from '@playwright/test';
import { parsePrice } from '../utils/price';

export interface ProductInfo {
  name: string;
  price: number;
}

export class ProductPage {
  readonly name: Locator;
  readonly unitPrice: Locator;
  readonly addToCartButton: Locator;
  readonly comparisonBar: Locator;
  private readonly quantity: Locator;
  private readonly addToCompareButton: Locator;
  private readonly compareNowLink: Locator;

  constructor(private readonly page: Page) {
    this.name = page.getByTestId('product-name');
    this.unitPrice = page.getByTestId('unit-price');
    this.addToCartButton = page.getByTestId('add-to-cart');
    this.comparisonBar = page.getByTestId('comparison-bar');
    this.quantity = page.getByTestId('quantity');
    this.addToCompareButton = page.getByTestId('add-to-compare');
    this.compareNowLink = page.getByTestId('compare-link');
  }

  async goto(productId: string): Promise<void> {
    await this.page.goto(`/product/${productId}`);
    await expect(this.name).toBeVisible();
  }

  async getInfo(): Promise<ProductInfo> {
    await expect(this.unitPrice).toHaveText(/\d/);
    return {
      name: (await this.name.innerText()).trim(),
      price: parsePrice(await this.unitPrice.innerText()),
    };
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantity.fill(String(quantity));
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }

  async addToCompare(): Promise<void> {
    await this.addToCompareButton.click();
  }

  async openComparison(): Promise<void> {
    await this.compareNowLink.click();
  }
}
