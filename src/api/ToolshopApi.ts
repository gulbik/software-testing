import { APIRequestContext, expect } from '@playwright/test';
import { apiAddressDetails, User } from '../data/testData';

const API_URL = process.env.API_URL ?? 'https://api.practicesoftwaretesting.com';

export interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
}

interface ApiProduct {
  id: string;
  name: string;
  price: number;
  in_stock: boolean;
  is_rental: boolean;
}

export class ToolshopApi {
  constructor(private readonly request: APIRequestContext) {}

  async registerUser(user: User): Promise<void> {
    const response = await this.request.post(`${API_URL}/users/register`, {
      data: {
        first_name: user.firstName,
        last_name: user.lastName,
        dob: user.dateOfBirth,
        phone: user.phone,
        email: user.email,
        password: user.password,
        address: {
          ...apiAddressDetails,
          house_number: user.address.houseNumber,
          country: user.address.country,
          postal_code: user.address.postalCode,
        },
      },
    });
    expect(response.status(), `Registering ${user.email} failed: ${await response.text()}`).toBe(201);
  }

  async findProducts(): Promise<Product[]> {
    const response = await this.request.get(`${API_URL}/products`, { params: { page: 1 } });
    expect(response.ok(), 'Loading products failed').toBeTruthy();
    const body = (await response.json()) as { data: ApiProduct[] };
    return body.data
      .filter((product) => !product.is_rental)
      .map((product) => ({ id: product.id, name: product.name, price: product.price, inStock: product.in_stock }));
  }
}
