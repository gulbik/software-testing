import { Locator, Page } from '@playwright/test';
import { User } from '../data/testData';
import { AddressForm } from './components/AddressForm';

export class RegisterPage {
  readonly url = /\/auth\/register$/;
  readonly registerError: Locator;
  private readonly firstName: Locator;
  private readonly lastName: Locator;
  private readonly dateOfBirth: Locator;
  private readonly address: AddressForm;
  private readonly phone: Locator;
  private readonly email: Locator;
  private readonly password: Locator;
  private readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.registerError = page.getByTestId('register-error');
    this.firstName = page.getByTestId('first-name');
    this.lastName = page.getByTestId('last-name');
    this.dateOfBirth = page.getByTestId('dob');
    this.address = new AddressForm(page);
    this.phone = page.getByTestId('phone');
    this.email = page.getByTestId('email');
    this.password = page.getByTestId('password');
    this.submitButton = page.getByTestId('register-submit');
  }

  async goto(): Promise<void> {
    await this.page.goto('/auth/register');
  }

  async register(user: User): Promise<void> {
    await this.firstName.fill(user.firstName);
    await this.lastName.fill(user.lastName);
    await this.dateOfBirth.fill(user.dateOfBirth);
    await this.address.fill(user.address);
    await this.phone.fill(user.phone);
    await this.email.fill(user.email);
    await this.password.fill(user.password);
    await this.submitButton.click();
  }
}
