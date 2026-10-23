import { Locator, Page } from '@playwright/test';
import { Address, Guest } from '../data/testData';
import { AddressForm } from './components/AddressForm';

export class CheckoutPage {
  readonly paymentSuccess: Locator;
  readonly orderConfirmation: Locator;
  private readonly guestTab: Locator;
  private readonly guestEmail: Locator;
  private readonly guestFirstName: Locator;
  private readonly guestLastName: Locator;
  private readonly guestSubmitButton: Locator;
  private readonly proceedAsGuestButton: Locator;
  private readonly billingAddress: AddressForm;
  private readonly proceedToPaymentButton: Locator;
  private readonly paymentMethod: Locator;
  private readonly finishButton: Locator;

  constructor(page: Page) {
    this.paymentSuccess = page.getByTestId('payment-success-message');
    this.orderConfirmation = page.locator('#order-confirmation');
    this.guestTab = page.getByRole('tab', { name: 'Continue as Guest' });
    this.guestEmail = page.getByTestId('guest-email');
    this.guestFirstName = page.getByTestId('guest-first-name');
    this.guestLastName = page.getByTestId('guest-last-name');
    this.guestSubmitButton = page.getByTestId('guest-submit');
    this.proceedAsGuestButton = page.getByTestId('proceed-2-guest');
    this.billingAddress = new AddressForm(page);
    this.proceedToPaymentButton = page.getByTestId('proceed-3');
    this.paymentMethod = page.getByTestId('payment-method');
    this.finishButton = page.getByTestId('finish');
  }

  async continueAsGuest(guest: Guest): Promise<void> {
    await this.guestTab.click();
    await this.guestEmail.fill(guest.email);
    await this.guestFirstName.fill(guest.firstName);
    await this.guestLastName.fill(guest.lastName);
    await this.guestSubmitButton.click();
    await this.proceedAsGuestButton.click();
  }

  async fillBillingAddress(address: Address): Promise<void> {
    await this.billingAddress.fill(address);
    await this.proceedToPaymentButton.click();
  }

  async checkPayment(method: string): Promise<void> {
    await this.paymentMethod.selectOption({ label: method });
    await this.finishButton.click();
  }

  async confirmOrder(): Promise<void> {
    await this.finishButton.filter({ hasText: 'Confirm' }).click();
  }
}
