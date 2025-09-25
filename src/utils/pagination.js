/**
 * Fetches all items from a paginated GraphQL query
 * @param {Function} client - GraphQL client instance
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables (excluding pagination)
 * @param {string} dataPath - Path to the data in response (e.g., 'listORIGIN_PRODUCTS')
 * @returns {Promise<Array>} All items from all pages
 */
export const fetchAllPages = async (client, query, variables = {}, dataPath) => {
  try {
    const result = await client.graphql({ 
      query, 
      variables 
    });
    
    if (result.errors && result.errors.length > 0) {
      console.error('GraphQL errors:', result.errors);
      result.errors.forEach(error => {
        console.error('Error message:', error.message);
        console.error('Error locations:', error.locations);
        console.error('Error path:', error.path);
      });
      return [];
    }
    
    const data = result.data?.[dataPath];
    if (Array.isArray(data)) {
      return data;
    } else if (data?.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching data:', error);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error('Detailed error:', err.message, err.locations, err.path);
      });
    }
    return [];
  }
};