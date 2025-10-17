import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/secureGraphQLClient', () => ({
  executeGraphQL: vi.fn()
}));

vi.mock('../utils/pagination.js', () => ({
  fetchAllPages: vi.fn()
}));

vi.mock('../graphql/queries.js', () => ({
  listOriginProducts: 'query listORIGIN_PRODUCTS { listORIGIN_PRODUCTS { items { ORIGIN_PRODUCT_ID } } }',
  listServices: 'query listSERVICES { listSERVICES { items { SERVICE_ID } } }',
  listServiceProviders: 'query listSERVICE_PROVIDERS { listSERVICE_PROVIDERS { items { SERVICE_PROVIDER_ID } } }',
  listServiceParams: 'query listSERVICE_PARAMS { listSERVICE_PARAMS { items { SERVICE_PARAM_ID } } }'
}));

vi.mock('../graphql/mutations.js', () => ({
  createOriginProduct: 'mutation createORIGIN_PRODUCT($input: CreateORIGIN_PRODUCTInput!) { createORIGIN_PRODUCT(input: $input) { ORIGIN_PRODUCT_ID } }',
  updateOriginProduct: 'mutation updateORIGIN_PRODUCT($input: UpdateORIGIN_PRODUCTInput!) { updateORIGIN_PRODUCT(input: $input) { ORIGIN_PRODUCT_ID } }'
}));

const { executeGraphQL } = await import('../utils/secureGraphQLClient');
const { fetchAllPages } = await import('../utils/pagination.js');
const { loadComparisonData, createComparisonRecord } = await import('../utils/comparisonClient');

describe('Comparison Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete window.compareEnvironment;
  });

  describe('loadComparisonData', () => {
    it('should return empty data when no environment set', async () => {
      const result = await loadComparisonData('ORIGIN_PRODUCT');
      expect(result).toEqual({ data: {} });
    });

    it('should load ORIGIN_PRODUCT data from comparison environment', async () => {
      window.compareEnvironment = 'test';
      
      vi.mocked(fetchAllPages).mockResolvedValue([
        { ORIGIN_PRODUCT_ID: 100, VENDOR_NAME: 'Test Vendor' }
      ]);

      const result = await loadComparisonData('ORIGIN_PRODUCT');

      expect(result).toEqual({
        data: {
          listORIGIN_PRODUCTS: {
            items: [{ ORIGIN_PRODUCT_ID: 100, VENDOR_NAME: 'Test Vendor' }]
          }
        }
      });
    });

    it('should handle SERVICE_PARAM data loading', async () => {
      window.compareEnvironment = 'live';
      
      vi.mocked(fetchAllPages).mockResolvedValue([
        { SERVICE_PARAM_ID: 1, SERVICE_ID: 5, PARAM_NAME: 'test_param' }
      ]);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await loadComparisonData('SERVICE_PARAM');

      expect(result).toEqual({
        data: {
          listSERVICE_PARAMS: {
            items: [{ SERVICE_PARAM_ID: 1, SERVICE_ID: 5, PARAM_NAME: 'test_param' }]
          }
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith('🔍 Starting SERVICE_PARAM fetch from live');
      consoleSpy.mockRestore();
    });

    it('should handle SERVICE_PARAM loading errors', async () => {
      window.compareEnvironment = 'dev';
      
      vi.mocked(fetchAllPages).mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await loadComparisonData('SERVICE_PARAM');

      expect(result).toEqual({
        data: {
          listSERVICE_PARAMS: {
            items: []
          }
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith('❌ Error loading SERVICE_PARAM:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should return empty data for unknown entity types', async () => {
      window.compareEnvironment = 'dev';
      
      const result = await loadComparisonData('UNKNOWN_ENTITY');

      expect(result).toEqual({ data: {} });
    });
  });

  describe('createComparisonRecord', () => {
    it('should create record in target environment', async () => {
      const formData = { VENDOR_NAME: 'New Vendor', PRODUCT_ID: 'PROD002' };
      const mockResponse = {
        data: {
          createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: 102, ...formData }
        }
      };

      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      const result = await createComparisonRecord('test', 'ORIGIN_PRODUCT', formData);

      expect(executeGraphQL).toHaveBeenCalledWith(
        expect.any(String),
        { input: { ...formData, CREATED_BY_USER_ID: NaN } },
        'test'
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle null mutation response', async () => {
      const formData = { VENDOR_NAME: 'New Vendor' };
      const mockResponse = { data: { createORIGIN_PRODUCT: null } };

      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await createComparisonRecord('test', 'ORIGIN_PRODUCT', formData);

      expect(consoleSpy).toHaveBeenCalledWith('Create mutation returned null - this is expected with Aurora VTL templates');
      expect(result.data.createORIGIN_PRODUCT).toEqual({
        ...formData,
        CREATED_BY_USER_ID: NaN,
        ORIGIN_PRODUCT_ID: -1
      });

      consoleSpy.mockRestore();
    });

    it('should handle GraphQL errors', async () => {
      const formData = { VENDOR_NAME: 'New Vendor' };
      const mockResponse = {
        data: null,
        errors: [{ message: 'Validation failed' }]
      };

      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      await expect(createComparisonRecord('test', 'ORIGIN_PRODUCT', formData)).rejects.toThrow('GraphQL errors: Validation failed');
    });

    it('should handle unsupported entity types', async () => {
      const formData = { NAME: 'Test' };

      await expect(createComparisonRecord('test', 'UNSUPPORTED_ENTITY', formData)).rejects.toThrow('Create mutation not implemented for UNSUPPORTED_ENTITY');
    });
  });
});