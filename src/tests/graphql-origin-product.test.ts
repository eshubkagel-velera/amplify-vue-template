import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/secureGraphQLClient', () => ({
  executeGraphQL: vi.fn()
}));

const { executeGraphQL } = await import('../utils/secureGraphQLClient');
const graphqlFunctions = await import('../graphql');

describe('ORIGIN_PRODUCT Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get origin product by id', async () => {
    const mockResponse = {
      data: {
        getORIGIN_PRODUCT: {
          ORIGIN_PRODUCT_ID: 100,
          VENDOR_NAME: 'Test Vendor',
          PRODUCT_ID: 'PROD001'
        }
      }
    };
    vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

    const result = await graphqlFunctions.getOriginProduct(100);

    expect(executeGraphQL).toHaveBeenCalledWith(
      expect.stringContaining('getORIGIN_PRODUCT'),
      { id: 100 }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should list origin products', async () => {
    const mockResponse = {
      data: {
        listORIGIN_PRODUCTS: {
          items: [
            { ORIGIN_PRODUCT_ID: 100, VENDOR_NAME: 'Vendor1' },
            { ORIGIN_PRODUCT_ID: 101, VENDOR_NAME: 'Vendor2' }
          ]
        }
      }
    };
    vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

    const result = await graphqlFunctions.listOriginProducts();

    expect(executeGraphQL).toHaveBeenCalledWith(
      expect.stringContaining('listORIGIN_PRODUCTS')
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle empty list origin products', async () => {
    const mockResponse = { data: {} };
    vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

    const result = await graphqlFunctions.listOriginProducts();

    expect(result).toEqual({ data: { listORIGIN_PRODUCTS: { items: [] } } });
  });

  it('should create origin product', async () => {
    const input = { VENDOR_NAME: 'New Vendor', PRODUCT_ID: 'PROD002' };
    const mockResponse = {
      data: {
        createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: 102, ...input }
      }
    };
    vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

    const result = await graphqlFunctions.createOriginProduct(input);

    expect(executeGraphQL).toHaveBeenCalledWith(
      expect.stringContaining('createORIGIN_PRODUCT'),
      { input }
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle null create origin product response', async () => {
    const input = { ORIGIN_PRODUCT_ID: 102, VENDOR_NAME: 'New Vendor' };
    const mockResponse = { data: { createORIGIN_PRODUCT: null } };
    vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

    const result = await graphqlFunctions.createOriginProduct(input);

    expect(result).toEqual({
      data: { createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: 102 } }
    });
  });

  it('should handle create origin product error', async () => {
    const input = { VENDOR_NAME: 'New Vendor' };
    vi.mocked(executeGraphQL).mockRejectedValue(new Error('Database error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const result = await graphqlFunctions.createOriginProduct(input);

    expect(result).toEqual({
      data: { createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } }
    });
    expect(consoleSpy).toHaveBeenCalledWith('Error creating ORIGIN_PRODUCT:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});