import { faker } from '@faker-js/faker';
import { createGuest, defaultAddress, singleUnitProducts } from '../src/data/testData';
import { Messages, PaymentMethods } from '../src/data/messages';
import { expect, test } from '../src/fixtures/test';
import { formatPrice } from '../src/utils/price';

test.describe('Buy a product', () => {
  test('a guest buys two units of an in-stock product', async ({ inStockProducts, productPage, header, cartPage, checkoutPage }) => {
    const quantity = 2;
    const product = faker.helpers.arrayElement(inStockProducts.filter((p) => !singleUnitProducts.includes(p.name)));
    const expectedTotal = formatPrice(product.price * quantity);

    await productPage.goto(product.id);
    await expect(productPage.name).toHaveText(product.name);
    await expect(productPage.addToCartButton, `${product.name} went out of stock`).toBeEnabled();

    await productPage.setQuantity(quantity);
    await productPage.addToCart();
    await expect(header.cartQuantity).toHaveText(String(quantity));

    await header.openCart();
    await expect(cartPage.productTitles).toHaveText([product.name]);
    const row = cartPage.row(product.name);
    await expect(row.quantity).toHaveValue(String(quantity));
    await expect(row.unitPrice).toHaveText(formatPrice(product.price));
    await expect(row.linePrice).toHaveText(expectedTotal);
    await expect(cartPage.total).toHaveText(expectedTotal);

    await cartPage.proceedToCheckout();
    await checkoutPage.continueAsGuest(createGuest());
    await checkoutPage.fillBillingAddress(defaultAddress);
    await checkoutPage.checkPayment(PaymentMethods.cashOnDelivery);
    await expect(checkoutPage.paymentSuccess).toHaveText(Messages.paymentSuccessful);

    await checkoutPage.confirmOrder();
    await expect(checkoutPage.orderConfirmation).toHaveText(Messages.orderConfirmation);
  });
});
