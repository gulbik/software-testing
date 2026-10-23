import { Locator, Page } from '@playwright/test';

export class Header {
  readonly signInLink: Locator;
  readonly userMenu: Locator;
  readonly cartQuantity: Locator;
  private readonly cartLink: Locator;

  constructor(page: Page) {
    this.signInLink = page.getByTestId('nav-sign-in');
    this.userMenu = page.getByTestId('nav-menu');
    this.cartQuantity = page.getByTestId('cart-quantity');
    this.cartLink = page.getByTestId('nav-cart');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
