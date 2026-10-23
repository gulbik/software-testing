import { expect, Locator, Page } from '@playwright/test';
import { Address } from '../../data/testData';

interface LookupResult {
  street: string;
  city: string;
  state: string;
}

export class AddressForm {
  private readonly country: Locator;
  private readonly postalCode: Locator;
  private readonly houseNumber: Locator;
  private readonly street: Locator;
  private readonly city: Locator;
  private readonly state: Locator;

  constructor(private readonly page: Page) {
    this.country = page.getByTestId('country');
    this.postalCode = page.getByTestId('postal_code');
    this.houseNumber = page.getByTestId('house_number');
    this.street = page.getByTestId('street');
    this.city = page.getByTestId('city');
    this.state = page.getByTestId('state');
  }

  async fill(address: Address): Promise<void> {
    const lookup = this.page.waitForResponse((response) => {
      const url = new URL(response.url());
      return (
        url.pathname.endsWith('/postcode-lookup') &&
        url.searchParams.get('postcode') === address.postalCode &&
        url.searchParams.get('house_number') === address.houseNumber
      );
    });
    await this.country.selectOption(address.country);
    await this.postalCode.fill(address.postalCode);
    await this.houseNumber.fill(address.houseNumber);

    const response = await lookup;
    expect(response.ok(), `Postcode lookup failed with ${response.status()}`).toBeTruthy();
    const result = (await response.json()) as LookupResult;
    await expect(this.street).toHaveValue(result.street);
    await expect(this.city).toHaveValue(result.city);
    await expect(this.state).toHaveValue(result.state);
  }
}
