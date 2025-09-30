import { executeGraphQL } from './utils/unifiedGraphQLClient.js';
import { type Schema } from './types';

// LOAN_APP operations
export const getLoanApp = async (id: number) => {
  return executeGraphQL(`query GetLOAN_APP($id: Int!) {
      getLOAN_APP(LOAN_APP_ID: $id) {
        CHANGED_DATE
        CREATED_DATE
        EXEC_ID
        LOAN_APP_ID
        ORIGIN_LOAN_APP_ID
        ORIGIN_PRODUCT_ID
        PROCESS_FLAG
      }
    }`, { id });
};

export const listLoanApps = async () => {
  try {
    const result = await executeGraphQL(`query ListLOAN_APPS {
        listLOAN_APPS {
          items {
            CHANGED_DATE
            CREATED_DATE
            EXEC_ID
            LOAN_APP_ID
            ORIGIN_LOAN_APP_ID
            ORIGIN_PRODUCT_ID
            PROCESS_FLAG
          }
        }
      }`);
    return result;
  } catch (error) {
    return { data: { listLOAN_APPS: { items: [] } } };
  }
};

export const createLoanApp = async (input: any) => {
  return executeGraphQL(`mutation CreateLOAN_APP($input: CreateLOAN_APPInput!) {
      createLOAN_APP(input: $input) {
        CHANGED_DATE
        CREATED_DATE
        EXEC_ID
        LOAN_APP_ID
        ORIGIN_LOAN_APP_ID
        ORIGIN_PRODUCT_ID
        PROCESS_FLAG
      }
    }`, { input });
};

export const updateLoanApp = async (input: any) => {
  return executeGraphQL(`mutation UpdateLOAN_APP($input: UpdateLOAN_APPInput!) {
      updateLOAN_APP(input: $input) {
        CHANGED_DATE
        CREATED_DATE
        EXEC_ID
        LOAN_APP_ID
        ORIGIN_LOAN_APP_ID
        ORIGIN_PRODUCT_ID
        PROCESS_FLAG
      }
    }`, { input });
};

export const deleteLoanApp = async (input: any) => {
  return executeGraphQL(`mutation DeleteLOAN_APP($input: DeleteLOAN_APPInput!) {
      deleteLOAN_APP(input: $input) {
        LOAN_APP_ID
      }
    }`, { input });
};

// ORIGIN_PRODUCT operations
export const getOriginProduct = async (id: number) => {
  return executeGraphQL(`query GetORIGIN_PRODUCT($id: Int!) {
      getORIGIN_PRODUCT(ORIGIN_PRODUCT_ID: $id) {
        CHANGED_BY_USER_ID
        CHANGED_DATE
        CREATED_BY_USER_ID
        CREATED_DATE
        ORIGIN_PRODUCT_ID
        PARTNER_CODE
        PRODUCT_DESC
        PRODUCT_ID
        PSCU_CLIENT_ID
        VENDOR_NAME
      }
    }`, { id });
};

export const listOriginProducts = async () => {
  try {
    const result = await executeGraphQL(`query ListOriginProduct {
        listORIGIN_PRODUCTS {
          nextToken
          items {
            ORIGIN_PRODUCT_ID
            VENDOR_NAME
            PSCU_CLIENT_ID
            PRODUCT_ID
            PRODUCT_DESC
            PARTNER_CODE
            CREATED_DATE
            CREATED_BY_USER_ID
            CHANGED_DATE
            CHANGED_BY_USER_ID
          }
        }
      }`);
    
    if (result.data && result.data.listOrigin_products && result.data.listOrigin_products.items) {
      return { data: { listORIGIN_PRODUCTS: { items: result.data.listOrigin_products.items } } };
    }
    
    return { data: { listORIGIN_PRODUCTS: { items: [] } } };
  } catch (error) {
    console.error('Error in listOriginProducts:', error);
    return { data: { listORIGIN_PRODUCTS: { items: [] } } };
  }
};

export const createOriginProduct = async (input: any) => {
  try {
    const result = await executeGraphQL(`mutation CreateORIGIN_PRODUCT($input: CreateORIGIN_PRODUCTInput!) {
        createORIGIN_PRODUCT(input: $input) {
          ORIGIN_PRODUCT_ID
          VENDOR_NAME
          PRODUCT_ID
          PSCU_CLIENT_ID
          PRODUCT_DESC
          PARTNER_CODE
          CREATED_BY_USER_ID
          CREATED_DATE
        }
      }`, { input });
    
    if (result.data && result.data.createORIGIN_PRODUCT === null) {
      return { data: { createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
    }
    
    return result;
  } catch (error) {
    console.error('Error creating ORIGIN_PRODUCT:', error);
    return { data: { createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
  }
};

export const updateOriginProduct = async (input: any) => {
  try {
    const result = await executeGraphQL(`mutation UpdateORIGIN_PRODUCT($input: UpdateORIGIN_PRODUCTInput!) {
        updateORIGIN_PRODUCT(input: $input) {
          ORIGIN_PRODUCT_ID
        }
      }`, { input });
    
    if (result.data && result.data.updateORIGIN_PRODUCT === null) {
      return { data: { updateORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
    }
    
    return result;
  } catch (error) {
    console.error('Error updating ORIGIN_PRODUCT:', error);
    return { data: { updateORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
  }
};

export const deleteOriginProduct = async (input: any) => {
  try {
    const result = await executeGraphQL(`mutation DeleteORIGIN_PRODUCT($input: DeleteORIGIN_PRODUCTInput!) {
        deleteORIGIN_PRODUCT(input: $input) {
          ORIGIN_PRODUCT_ID
        }
      }`, { input });
    
    if (result.data && result.data.deleteORIGIN_PRODUCT === null) {
      return { data: { deleteORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
    }
    
    return result;
  } catch (error) {
    console.error('Error deleting ORIGIN_PRODUCT:', error);
    return { data: { deleteORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
  }
};

// Note: Batch operations would need to be implemented differently with the unified client
// For now, keeping them as sequential operations
export const createServiceParamMappingBatch = async (inputs: any[]) => {
  const results = [];
  
  for (const input of inputs) {
    const result = await executeGraphQL(`mutation CreateSERVICE_PARAM_MAPPING($input: CreateSERVICE_PARAM_MAPPINGInput!) {
        createSERVICE_PARAM_MAPPING(input: $input) {
          SERVICE_PARAM_MAPPING_ID
          ORIGIN_PRODUCT_ID
          SOURCE_SERVICE_PARAM_ID
          TARGET_SERVICE_PARAM_ID
          CREATED_BY_USER_ID
          CREATED_DATE
        }
      }`, { input });
    results.push(result.data.createSERVICE_PARAM_MAPPING);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return { data: { createSERVICE_PARAM_MAPPINGBatch: { items: results } } };
};

export const createServiceExprMappingBatch = async (inputs: any[]) => {
  const results = [];
  
  for (const input of inputs) {
    const result = await executeGraphQL(`mutation CreateSERVICE_EXPR_MAPPING($input: CreateSERVICE_EXPR_MAPPINGInput!) {
        createSERVICE_EXPR_MAPPING(input: $input) {
          SERVICE_EXPR_MAPPING_ID
          SERVICE_PARAM_MAPPING_ID
          SOURCE_EXPR
          TARGET_EXPR
          CREATED_BY_USER_ID
          CREATED_DATE
        }
      }`, { input });
    results.push(result.data.createSERVICE_EXPR_MAPPING);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return { data: { createSERVICE_EXPR_MAPPINGBatch: { items: results } } };
};

export const createServiceBatch = async (inputs: any[]) => {
  const BATCH_SIZE = 10;
  const results = [];
  
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);
    
    try {
      // Note: This would need to be implemented as individual calls with unified client
      // since batch operations aren't supported in the same way
      for (const input of batch) {
        const result = await executeGraphQL(`mutation CreateSERVICE($input: CreateSERVICEInput!) {
            createSERVICE(input: $input) {
              SERVICE_ID
              SERVICE_PROVIDER_ID
              URI
              CREATED_DATE
            }
          }`, { input });
        results.push(result);
      }
      
      if (i + BATCH_SIZE < inputs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error);
      throw error;
    }
  }
  
  return results;
};

export const createServiceParamBatch = async (inputs: any[]) => {
  const BATCH_SIZE = 10;
  const results = [];
  
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const batch = inputs.slice(i, i + BATCH_SIZE);
    
    try {
      for (const input of batch) {
        const result = await executeGraphQL(`mutation CreateSERVICE_PARAM($input: CreateSERVICE_PARAMInput!) {
            createSERVICE_PARAM(input: $input) {
              SERVICE_PARAM_ID
              SERVICE_ID
              PARAM_NAME
              CREATED_DATE
            }
          }`, { input });
        results.push(result);
      }
      
      if (i + BATCH_SIZE < inputs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} failed:`, error);
      throw error;
    }
  }
  
  return results;
};