import { test as base, expect } from '@playwright/test';
import { Product, ToolshopApi } from '../api/ToolshopApi';
import { createUser, User } from '../data/testData';
import { AccountPage } from '../pages/AccountPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ComparisonPage } from '../pages/ComparisonPage';
import { Header } from '../pages/components/Header';
import { ForgotPasswordPage } from '../pages/ForgotPasswordPage';
import { LoginPage } from '../pages/LoginPage';
import { ProductPage } from '../pages/ProductPage';
import { RegisterPage } from '../pages/RegisterPage';

type Fixtures = {
  header: Header;
  registerPage: RegisterPage;
  loginPage: LoginPage;
  accountPage: AccountPage;
  forgotPasswordPage: ForgotPasswordPage;
  productPage: ProductPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  comparisonPage: ComparisonPage;
  api: ToolshopApi;
  registeredUser: User;
  products: Product[];
  inStockProducts: Product[];
};

export const test = base.extend<Fixtures>({
  header: async ({ page }, use) => use(new Header(page)),
  registerPage: async ({ page }, use) => use(new RegisterPage(page)),
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  accountPage: async ({ page }, use) => use(new AccountPage(page)),
  forgotPasswordPage: async ({ page }, use) => use(new ForgotPasswordPage(page)),
  productPage: async ({ page }, use) => use(new ProductPage(page)),
  cartPage: async ({ page }, use) => use(new CartPage(page)),
  checkoutPage: async ({ page }, use) => use(new CheckoutPage(page)),
  comparisonPage: async ({ page }, use) => use(new ComparisonPage(page)),

  api: async ({ request }, use) => use(new ToolshopApi(request)),

  registeredUser: async ({ api }, use) => {
    const user = createUser();
    await api.registerUser(user);
    await use(user);
  },

  products: async ({ api }, use) => use(await api.findProducts()),

  inStockProducts: async ({ products }, use) => {
    const inStock = products.filter((product) => product.inStock);
    expect(inStock.length, 'No product is in stock right now').toBeGreaterThan(0);
    await use(inStock);
  },
});

export { expect };
