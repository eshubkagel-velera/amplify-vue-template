import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { graphqlClient, executeGraphQL } from '../utils/secureGraphQLClient';

// Mock fetch and AWS Amplify
global.fetch = vi.fn();

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn()
}));

const { fetchAuthSession } = await import('aws-amplify/auth');

describe('SecureGraphQLClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAuthSession).mockResolvedValue({
      tokens: { accessToken: { toString: () => 'mock-token' } }
    });
    localStorage.setItem('selectedEnvironment', 'dev');
    
    // Mock environment variables
    import.meta.env = {
      VITE_DEV_GRAPHQL_URL: 'https://dev.example.com/graphql',
      VITE_TEST_GRAPHQL_URL: 'https://test.example.com/graphql',
      VITE_UAT_GRAPHQL_URL: 'https://uat.example.com/graphql',
      VITE_LIVE_GRAPHQL_URL: 'https://live.example.com/graphql'
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Security Validation', () => {
    it('should reject invalid operations', async () => {
      const invalidQuery = 'query maliciousQuery { __schema { types { name } } }';
      
      await expect(executeGraphQL(invalidQuery)).rejects.toThrow('Operation not allowed');
    });

    it('should validate environment', async () => {
      await expect(executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', {}, 'invalid')).rejects.toThrow('Invalid environment');
    });

    it('should sanitize variables', async () => {
      const mockResponse = { data: { getLOAN_APP: { LOAN_APP_ID: 1 } } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const maliciousVars = {
        id: 1,
        __proto__: { malicious: true },
        constructor: { prototype: { hack: true } }
      };

      await executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', maliciousVars);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body.variables).not.toHaveProperty('__proto__');
      expect(body.variables).not.toHaveProperty('constructor');
      expect(body.variables).toEqual({ id: 1 });
    });

    it('should require authentication', async () => {
      vi.mocked(fetchAuthSession).mockResolvedValue({ tokens: null });
      
      await expect(executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }')).rejects.toThrow('Authentication required');
    });

    it('should add CSRF protection headers', async () => {
      const mockResponse = { data: { getLOAN_APP: { LOAN_APP_ID: 1 } } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', { id: 1 });

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].headers['X-Requested-With']).toBe('XMLHttpRequest');
      expect(fetchCall[1].headers['Authorization']).toBe('mock-token');
    });
  });

  describe('Environment Handling', () => {
    it('should use default environment when none specified', async () => {
      const mockResponse = { data: { getLOAN_APP: { LOAN_APP_ID: 1 } } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', { id: 1 });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://dev.example.com/graphql',
        expect.any(Object)
      );
    });

    it('should use target environment when specified', async () => {
      const mockResponse = { data: { getLOAN_APP: { LOAN_APP_ID: 1 } } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', { id: 1 }, 'test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.example.com/graphql',
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', { id: 1 })).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      await expect(executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', { id: 1 })).rejects.toThrow('GraphQL request failed: Network error');
    });

    it('should handle GraphQL errors without exposing sensitive info', async () => {
      const mockResponse = {
        data: null,
        errors: [{ message: 'Field error', extensions: { code: 'INTERNAL_ERROR' } }]
      };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', { id: 1 });

      expect(result.errors).toHaveLength(1);
      expect(consoleSpy).toHaveBeenCalledWith('GraphQL errors:', ['Field error']);
      
      consoleSpy.mockRestore();
    });
  });

  describe('Batch Operations', () => {
    it('should execute batch operations with rate limiting', async () => {
      const mockResponse = { data: { createSERVICE: { SERVICE_ID: 1 } } };
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const operations = [
        { query: 'mutation createSERVICE($input: CreateSERVICEInput!) { createSERVICE(input: $input) { SERVICE_ID } }', variables: { input: { URI: 'test1' } } },
        { query: 'mutation createSERVICE($input: CreateSERVICEInput!) { createSERVICE(input: $input) { SERVICE_ID } }', variables: { input: { URI: 'test2' } } }
      ];

      const startTime = Date.now();
      const results = await graphqlClient.executeBatch(operations, 'dev', 1, 50);
      const endTime = Date.now();

      expect(results).toHaveLength(2);
      expect(endTime - startTime).toBeGreaterThanOrEqual(50); // Rate limiting delay
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should handle batch failures gracefully', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: { createSERVICE: { SERVICE_ID: 1 } } })
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const operations = [
        { query: 'mutation createSERVICE($input: CreateSERVICEInput!) { createSERVICE(input: $input) { SERVICE_ID } }', variables: { input: { URI: 'test1' } } },
        { query: 'mutation createSERVICE($input: CreateSERVICEInput!) { createSERVICE(input: $input) { SERVICE_ID } }', variables: { input: { URI: 'test2' } } }
      ];

      const results = await graphqlClient.executeBatch(operations);

      expect(results).toHaveLength(2);
      expect(results[0].data).toBeDefined();
      expect(results[1].errors).toBeDefined();
      expect(results[1].errors[0].message).toContain('Network error');
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long requests', async () => {
      vi.useFakeTimers();
      
      (global.fetch as any).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 35000))
      );

      const promise = executeGraphQL('query getLOAN_APP($id: Int!) { getLOAN_APP(LOAN_APP_ID: $id) { LOAN_APP_ID } }', { id: 1 });
      
      vi.advanceTimersByTime(30000);
      
      await expect(promise).rejects.toThrow();
      
      vi.useRealTimers();
    });
  });
});