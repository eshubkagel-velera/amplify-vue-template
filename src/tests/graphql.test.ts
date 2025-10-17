import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/secureGraphQLClient', () => ({
  executeGraphQL: vi.fn()
}));

const { executeGraphQL } = await import('../utils/secureGraphQLClient');
const graphqlFunctions = await import('../graphql');

describe('GraphQL Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('LOAN_APP Operations', () => {
    it('should get loan app by id', async () => {
      const mockResponse = {
        data: {
          getLOAN_APP: {
            LOAN_APP_ID: 1,
            ORIGIN_PRODUCT_ID: 100,
            PROCESS_FLAG: 'Y'
          }
        }
      };
      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      const result = await graphqlFunctions.getLoanApp(1);

      expect(executeGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('getLOAN_APP'),
        { id: 1 }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should list loan apps', async () => {
      const mockResponse = {
        data: {
          listLOAN_APPS: {
            items: [
              { LOAN_APP_ID: 1, PROCESS_FLAG: 'Y' },
              { LOAN_APP_ID: 2, PROCESS_FLAG: 'N' }
            ]
          }
        }
      };
      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      const result = await graphqlFunctions.listLoanApps();

      expect(executeGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('listLOAN_APPS')
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle list loan apps error gracefully', async () => {
      vi.mocked(executeGraphQL).mockRejectedValue(new Error('Network error'));

      const result = await graphqlFunctions.listLoanApps();

      expect(result).toEqual({ data: { listLOAN_APPS: { items: [] } } });
    });

    it('should create loan app', async () => {
      const input = { ORIGIN_PRODUCT_ID: 100, PROCESS_FLAG: 'Y' };
      const mockResponse = {
        data: {
          createLOAN_APP: { LOAN_APP_ID: 1, ...input }
        }
      };
      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      const result = await graphqlFunctions.createLoanApp(input);

      expect(executeGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('createLOAN_APP'),
        { input }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update loan app', async () => {
      const input = { LOAN_APP_ID: 1, PROCESS_FLAG: 'N' };
      const mockResponse = {
        data: {
          updateLOAN_APP: input
        }
      };
      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      const result = await graphqlFunctions.updateLoanApp(input);

      expect(executeGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('updateLOAN_APP'),
        { input }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should delete loan app', async () => {
      const input = { LOAN_APP_ID: 1 };
      const mockResponse = {
        data: {
          deleteLOAN_APP: { LOAN_APP_ID: 1 }
        }
      };
      vi.mocked(executeGraphQL).mockResolvedValue(mockResponse);

      const result = await graphqlFunctions.deleteLoanApp(input);

      expect(executeGraphQL).toHaveBeenCalledWith(
        expect.stringContaining('deleteLOAN_APP'),
        { input }
      );
      expect(result).toEqual(mockResponse);
    });
  });
});