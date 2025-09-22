import { util } from '@aws-appsync/utils';
import { toJsonObject } from '@aws-appsync/utils/rds';

export function validateInput(input, requiredFields) {
  for (const field of requiredFields) {
    if (!input[field]) {
      util.error(`Missing required field: ${field}`, 'ValidationError');
    }
  }
}

export function safeArrayAccess(result, path = [0, 0]) {
  const jsonResult = toJsonObject(result);
  return path.reduce((acc, index) => acc?.[index], jsonResult) || null;
}

export function optimizeOrderBy(orderByInput) {
  return orderByInput.flatMap(x => Object.entries(x).map(([column, dir]) => ({ column, dir })));
}

export const DB_SCHEMA = process.env.DB_SCHEMA || 'hazel_mapping_dev';