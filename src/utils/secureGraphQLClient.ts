import { fetchAuthSession } from 'aws-amplify/auth';

interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; extensions?: any }>;
}

interface GraphQLRequest {
  query: string;
  variables?: Record<string, any>;
}

class SecureGraphQLClient {
  private readonly envUrls: Record<string, string>;
  private readonly allowedOperations: Set<string>;

  constructor() {
    this.envUrls = {
      dev: import.meta.env.VITE_DEV_GRAPHQL_URL,
      test: import.meta.env.VITE_TEST_GRAPHQL_URL,
      uat: import.meta.env.VITE_UAT_GRAPHQL_URL,
      live: import.meta.env.VITE_LIVE_GRAPHQL_URL
    };

    // Whitelist allowed operations to prevent injection
    this.allowedOperations = new Set([
      'getLOAN_APP', 'listLOAN_APPS', 'createLOAN_APP', 'updateLOAN_APP', 'deleteLOAN_APP',
      'getORIGIN_PRODUCT', 'listORIGIN_PRODUCTS', 'createORIGIN_PRODUCT', 'updateORIGIN_PRODUCT', 'deleteORIGIN_PRODUCT',
      'listSERVICE_PROVIDERS', 'createSERVICE_PROVIDER', 'updateSERVICE_PROVIDER',
      'listSERVICES', 'createSERVICE', 'updateSERVICE',
      'listSERVICE_PARAMS', 'createSERVICE_PARAM', 'updateSERVICE_PARAM',
      'listSTEP_TYPES', 'createSTEP_TYPE', 'updateSTEP_TYPE',
      'listREDIRECT_URLS', 'createREDIRECT_URL', 'updateREDIRECT_URL',
      'listSERVICE_PARAM_MAPPINGS', 'createSERVICE_PARAM_MAPPING',
      'listSTEP_SERVICE_MAPPINGS'
    ]);
  }

  private validateEnvironment(environment: string): string {
    if (!environment || !this.envUrls[environment]) {
      throw new Error(`Invalid environment: ${environment}`);
    }
    return this.envUrls[environment];
  }

  private validateOperation(query: string): void {
    // Extract operation name from query
    const operationMatch = query.match(/(?:query|mutation)\s+(\w+)/);
    if (!operationMatch) {
      throw new Error('Invalid GraphQL operation format');
    }

    const operationName = operationMatch[1];
    if (!this.allowedOperations.has(operationName)) {
      throw new Error(`Operation not allowed: ${operationName}`);
    }
  }

  private sanitizeVariables(variables: Record<string, any>): Record<string, any> {
    // Basic sanitization - remove potentially dangerous properties
    const sanitized = { ...variables };
    
    // Remove any properties that could be used for injection
    delete sanitized.__proto__;
    delete sanitized.constructor;
    
    return sanitized;
  }

  async execute<T = any>(
    query: string,
    variables: Record<string, any> = {},
    targetEnvironment?: string
  ): Promise<GraphQLResponse<T>> {
    try {
      // Validate inputs
      this.validateOperation(query);
      const sanitizedVariables = this.sanitizeVariables(variables);

      // Get environment
      const environment = targetEnvironment || localStorage.getItem('selectedEnvironment') || 'dev';
      const endpoint = this.validateEnvironment(environment);

      // Get authentication token
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      if (!token) {
        throw new Error('Authentication required');
      }

      // Execute request with timeout and proper headers
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
          'X-Requested-With': 'XMLHttpRequest' // CSRF protection
        },
        body: JSON.stringify({
          query: query.trim(),
          variables: sanitizedVariables
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: GraphQLResponse<T> = await response.json();

      // Log errors but don't expose sensitive information
      if (result.errors?.length) {
        console.error('GraphQL errors:', result.errors.map(e => e.message));
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
      throw new Error('GraphQL request failed: Unknown error');
    }
  }

  // Batch operations with rate limiting
  async executeBatch<T = any>(
    operations: Array<{ query: string; variables?: Record<string, any> }>,
    targetEnvironment?: string,
    batchSize: number = 5,
    delayMs: number = 100
  ): Promise<Array<GraphQLResponse<T>>> {
    const results: Array<GraphQLResponse<T>> = [];

    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      
      const batchPromises = batch.map(op => 
        this.execute<T>(op.query, op.variables, targetEnvironment)
      );

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({ errors: [{ message: result.reason.message }] });
        }
      });

      // Rate limiting delay between batches
      if (i + batchSize < operations.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    return results;
  }
}

// Export singleton instance
export const graphqlClient = new SecureGraphQLClient();

// Backward compatibility exports
export const executeGraphQL = graphqlClient.execute.bind(graphqlClient);
export const executeBatchGraphQL = graphqlClient.executeBatch.bind(graphqlClient);