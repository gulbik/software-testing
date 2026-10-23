import { expect, test } from '../src/fixtures/test';
import { formatPrice } from '../src/utils/price';

test.describe('Compare two products', () => {
  test('the comparison shows the cheaper and the more expensive product with their prices', async ({ page, products, productPage, comparisonPage }) => {
    const [first] = products;
    const second = products.find((product) => product.price !== first.price);
    expect(second, 'Needs two products with different prices').toBeDefined();
    const [cheaper, pricier] = [first, second!].sort((a, b) => a.price - b.price);

    await productPage.goto(cheaper.id);
    const cheaperOnPage = await productPage.getInfo();
    expect(cheaperOnPage).toEqual({ name: cheaper.name, price: cheaper.price });
    await productPage.addToCompare();

    await productPage.goto(pricier.id);
    const pricierOnPage = await productPage.getInfo();
    expect(pricierOnPage).toEqual({ name: pricier.name, price: pricier.price });
    await productPage.addToCompare();

    await expect(productPage.comparisonBar).toContainText('2 product(s) selected');
    await productPage.openComparison();
    await expect(page).toHaveURL(comparisonPage.url);

    await expect(comparisonPage.productNames).toHaveText([cheaperOnPage.name, pricierOnPage.name]);
    await expect(comparisonPage.prices).toHaveText([formatPrice(cheaperOnPage.price), formatPrice(pricierOnPage.price)]);
  });
});
