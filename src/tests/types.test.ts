import { describe, it, expect } from 'vitest';
import type { OriginProduct, Service, RedirectUrl } from '../types';

describe('TypeScript Interfaces', () => {
  it('should validate OriginProduct interface', () => {
    const product: OriginProduct = {
      ORIGIN_PRODUCT_ID: 1,
      PRODUCT_ID: 'PROD001',
      PSCU_CLIENT_ID: 'CLIENT001',
      PARTNER_CODE: 'PART001',
      PRODUCT_DESC: 'Test Product',
      VENDOR_NAME: 'Test Vendor',
      CREATED_DATE: '2024-01-01',
      CREATED_BY_USER_ID: 1
    };

    expect(product.ORIGIN_PRODUCT_ID).toBe(1);
    expect(product.PRODUCT_ID).toBe('PROD001');
  });

  it('should validate RedirectUrl interface', () => {
    const redirectUrl: RedirectUrl = {
      REDIRECT_URL_ID: 1,
      ORIGIN_PRODUCT_ID: 1,
      URL_TYPE_CODE: 'E',
      URL: 'https://example.com',
      CREATED_DATE: '2024-01-01',
      CREATED_BY_USER_ID: 1
    };

    expect(redirectUrl.URL_TYPE_CODE).toBe('E');
    expect(redirectUrl.URL).toBe('https://example.com');
  });
});