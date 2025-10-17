import { executeGraphQL } from './utils/secureGraphQLClient.js';
import { type Schema } from './types';
import * as queries from './graphql/queries.js';
import * as mutations from './graphql/mutations.js';

// LOAN_APP operations
export const getLoanApp = async (id: number) => {
  return executeGraphQL(queries.GET_LOAN_APP, { id });
};

export const listLoanApps = async () => {
  try {
    const result = await executeGraphQL(queries.LIST_LOAN_APPS);
    return result;
  } catch (error) {
    return { data: { listLOAN_APPS: { items: [] } } };
  }
};

export const createLoanApp = async (input: any) => {
  return executeGraphQL(mutations.CREATE_LOAN_APP, { input });
};

export const updateLoanApp = async (input: any) => {
  return executeGraphQL(mutations.UPDATE_LOAN_APP, { input });
};

export const deleteLoanApp = async (input: any) => {
  return executeGraphQL(mutations.DELETE_LOAN_APP, { input });
};

// ORIGIN_PRODUCT operations
export const getOriginProduct = async (id: number) => {
  return executeGraphQL(queries.GET_ORIGIN_PRODUCT, { id });
};

export const listOriginProducts = async () => {
  try {
    const result = await executeGraphQL(queries.LIST_ORIGIN_PRODUCTS);
    return result.data?.listORIGIN_PRODUCTS?.items ? result : { data: { listORIGIN_PRODUCTS: { items: [] } } };
  } catch (error) {
    console.error('Error in listOriginProducts:', error);
    return { data: { listORIGIN_PRODUCTS: { items: [] } } };
  }
};

export const createOriginProduct = async (input: any) => {
  try {
    const result = await executeGraphQL(mutations.CREATE_ORIGIN_PRODUCT, { input });
    return result.data?.createORIGIN_PRODUCT === null 
      ? { data: { createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } }
      : result;
  } catch (error) {
    console.error('Error creating ORIGIN_PRODUCT:', error);
    return { data: { createORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
  }
};

export const updateOriginProduct = async (input: any) => {
  try {
    const result = await executeGraphQL(mutations.UPDATE_ORIGIN_PRODUCT, { input });
    return result.data?.updateORIGIN_PRODUCT === null
      ? { data: { updateORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } }
      : result;
  } catch (error) {
    console.error('Error updating ORIGIN_PRODUCT:', error);
    return { data: { updateORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
  }
};

export const deleteOriginProduct = async (input: any) => {
  try {
    const result = await executeGraphQL(mutations.DELETE_ORIGIN_PRODUCT, { input });
    return result.data?.deleteORIGIN_PRODUCT === null
      ? { data: { deleteORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } }
      : result;
  } catch (error) {
    console.error('Error deleting ORIGIN_PRODUCT:', error);
    return { data: { deleteORIGIN_PRODUCT: { ORIGIN_PRODUCT_ID: input.ORIGIN_PRODUCT_ID } } };
  }
};

// Batch operations using secure client
export const createServiceParamMappingBatch = async (inputs: any[]) => {
  const operations = inputs.map(input => ({
    query: mutations.CREATE_SERVICE_PARAM_MAPPING,
    variables: { input }
  }));
  
  const { executeBatchGraphQL } = await import('./utils/secureGraphQLClient.js');
  const results = await executeBatchGraphQL(operations);
  const items = results.map(r => r.data?.createSERVICE_PARAM_MAPPING).filter(Boolean);
  
  return { data: { createSERVICE_PARAM_MAPPINGBatch: { items } } };
};

export const createServiceExprMappingBatch = async (inputs: any[]) => {
  const operations = inputs.map(input => ({
    query: mutations.CREATE_SERVICE_EXPR_MAPPING,
    variables: { input }
  }));
  
  const { executeBatchGraphQL } = await import('./utils/secureGraphQLClient.js');
  const results = await executeBatchGraphQL(operations);
  const items = results.map(r => r.data?.createSERVICE_EXPR_MAPPING).filter(Boolean);
  
  return { data: { createSERVICE_EXPR_MAPPINGBatch: { items } } };
};

export const createServiceBatch = async (inputs: any[]) => {
  const operations = inputs.map(input => ({
    query: mutations.CREATE_SERVICE,
    variables: { input }
  }));
  
  const { executeBatchGraphQL } = await import('./utils/secureGraphQLClient.js');
  return await executeBatchGraphQL(operations, undefined, 10, 100);
};

export const createServiceParamBatch = async (inputs: any[]) => {
  const operations = inputs.map(input => ({
    query: mutations.CREATE_SERVICE_PARAM,
    variables: { input }
  }));
  
  const { executeBatchGraphQL } = await import('./utils/secureGraphQLClient.js');
  return await executeBatchGraphQL(operations, undefined, 10, 100);
};