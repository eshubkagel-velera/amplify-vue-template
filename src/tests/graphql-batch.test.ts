import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/secureGraphQLClient', () => ({
  executeGraphQL: vi.fn(),
  executeBatchGraphQL: vi.fn()
}));

const { executeBatchGraphQL } = await import('../utils/secureGraphQLClient');
const graphqlFunctions = await import('../graphql');

describe('Batch Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createServiceParamMappingBatch', () => {
    it('should create service param mappings in batch', async () => {
      const inputs = [
        { ORIGIN_PRODUCT_ID: 100, SOURCE_SERVICE_PARAM_ID: 1, TARGET_SERVICE_PARAM_ID: 2 },
        { ORIGIN_PRODUCT_ID: 101, SOURCE_SERVICE_PARAM_ID: 3, TARGET_SERVICE_PARAM_ID: 4 }
      ];

      const mockBatchResults = [
        { data: { createSERVICE_PARAM_MAPPING: { SERVICE_PARAM_MAPPING_ID: 1, ...inputs[0] } } },
        { data: { createSERVICE_PARAM_MAPPING: { SERVICE_PARAM_MAPPING_ID: 2, ...inputs[1] } } }
      ];

      vi.mocked(executeBatchGraphQL).mockResolvedValue(mockBatchResults);

      const result = await graphqlFunctions.createServiceParamMappingBatch(inputs);

      expect(executeBatchGraphQL).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            query: expect.stringContaining('createSERVICE_PARAM_MAPPING'),
            variables: { input: inputs[0] }
          }),
          expect.objectContaining({
            query: expect.stringContaining('createSERVICE_PARAM_MAPPING'),
            variables: { input: inputs[1] }
          })
        ])
      );

      expect(result).toEqual({
        data: {
          createSERVICE_PARAM_MAPPINGBatch: {
            items: [
              { SERVICE_PARAM_MAPPING_ID: 1, ...inputs[0] },
              { SERVICE_PARAM_MAPPING_ID: 2, ...inputs[1] }
            ]
          }
        }
      });
    });

    it('should handle batch failures', async () => {
      const inputs = [
        { ORIGIN_PRODUCT_ID: 100, SOURCE_SERVICE_PARAM_ID: 1, TARGET_SERVICE_PARAM_ID: 2 }
      ];

      const mockBatchResults = [
        { errors: [{ message: 'Database error' }] }
      ];

      vi.mocked(executeBatchGraphQL).mockResolvedValue(mockBatchResults);

      const result = await graphqlFunctions.createServiceParamMappingBatch(inputs);

      expect(result).toEqual({
        data: {
          createSERVICE_PARAM_MAPPINGBatch: {
            items: []
          }
        }
      });
    });
  });

  describe('createServiceBatch', () => {
    it('should create services in batch with proper configuration', async () => {
      const inputs = [
        { SERVICE_PROVIDER_ID: 1, URI: '/api/service1' },
        { SERVICE_PROVIDER_ID: 2, URI: '/api/service2' }
      ];

      const mockBatchResults = [
        { data: { createSERVICE: { SERVICE_ID: 1, ...inputs[0] } } },
        { data: { createSERVICE: { SERVICE_ID: 2, ...inputs[1] } } }
      ];

      vi.mocked(executeBatchGraphQL).mockResolvedValue(mockBatchResults);

      const result = await graphqlFunctions.createServiceBatch(inputs);

      expect(executeBatchGraphQL).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            query: expect.stringContaining('createSERVICE'),
            variables: { input: inputs[0] }
          }),
          expect.objectContaining({
            query: expect.stringContaining('createSERVICE'),
            variables: { input: inputs[1] }
          })
        ]),
        undefined,
        10,
        100
      );

      expect(result).toEqual(mockBatchResults);
    });
  });
});