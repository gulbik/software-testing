import { faker } from '@faker-js/faker';

export interface Address {
  country: string;
  postalCode: string;
  houseNumber: string;
}

export interface User {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  password: string;
  address: Address;
}

export interface Guest {
  email: string;
  firstName: string;
  lastName: string;
}

export const defaultAddress: Address = {
  country: 'NL',
  postalCode: '1011AB',
  houseNumber: '42',
};

export const apiAddressDetails = {
  street: 'Damrak',
  city: 'Amsterdam',
  state: 'Noord-Holland',
};

export const singleUnitProducts = ['Thor Hammer'];

export const passwordAfterReset = 'welcome02';

function lettersOnly(name: string): string {
  return name.replace(/[^A-Za-z]/g, '');
}

export function uniqueEmail(prefix = 'qa'): string {
  return `${prefix}.${Date.now()}.${faker.string.alphanumeric({ length: 8, casing: 'lower' })}@example.com`;
}

export function generatePassword(): string {
  return `Qa!${faker.string.alphanumeric(12)}9$`;
}

export function createUser(): User {
  return {
    firstName: lettersOnly(faker.person.firstName()),
    lastName: `${lettersOnly(faker.person.lastName())}-${faker.string.alphanumeric({ length: 6, casing: 'lower' })}`,
    dateOfBirth: faker.date.birthdate({ mode: 'age', min: 18, max: 75 }).toISOString().slice(0, 10),
    phone: faker.string.numeric({ length: 10, allowLeadingZeros: false }),
    email: uniqueEmail(),
    password: generatePassword(),
    address: defaultAddress,
  };
}

export function fullName(user: User): string {
  return `${user.firstName} ${user.lastName}`;
}

export function createGuest(): Guest {
  return {
    email: uniqueEmail('guest'),
    firstName: lettersOnly(faker.person.firstName()),
    lastName: lettersOnly(faker.person.lastName()),
  };
}
