// Mock GraphQL client for testing
export function getMockClient() {
  return {
    graphql: async ({ query, variables }) => {
      // Mock successful responses for testing
      const queryStr = typeof query === 'string' ? query : query.loc?.source?.body || '';
      
      // Mock list queries
      if (queryStr.includes('list')) {
        const match = queryStr.match(/list([A-Z_]+)S?/);
        const fieldName = match ? `list${match[1]}S` : 'listItems';
        return {
          data: {
            [fieldName]: {
              items: [],
              nextToken: null
            }
          }
        };
      }
      
      // Mock create mutations
      if (queryStr.includes('create')) {
        const match = queryStr.match(/create([A-Z_]+)/);
        const tableName = match ? match[1] : 'ITEM';
        const input = variables?.input || {};
        return {
          data: {
            [`create${tableName}`]: {
              ...input,
              [`${tableName}_ID`]: Math.floor(Math.random() * 1000) + 1
            }
          }
        };
      }
      
      // Mock update mutations
      if (queryStr.includes('update')) {
        const match = queryStr.match(/update([A-Z_]+)/);
        const tableName = match ? match[1] : 'ITEM';
        return {
          data: {
            [`update${tableName}`]: variables?.input || {}
          }
        };
      }
      
      // Mock delete mutations
      if (queryStr.includes('delete')) {
        const match = queryStr.match(/delete([A-Z_]+)/);
        const tableName = match ? match[1] : 'ITEM';
        return {
          data: {
            [`delete${tableName}`]: variables?.input || {}
          }
        };
      }
      
      // Default error for unsupported operations
      return {
        errors: [{ message: 'Mock: Operation not supported' }]
      };
    }
  };
}