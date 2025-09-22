import { util } from '@aws-appsync/utils';
import { insert, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

function validateInput(input, requiredFields) {
  for (const field of requiredFields) {
    if (!input[field]) {
      util.error(`Missing required field: ${field}`, 'ValidationError');
    }
  }
}

function safeArrayAccess(result, path = [0, 0]) {
  const jsonResult = toJsonObject(result);
  return path.reduce((acc, index) => acc?.[index], jsonResult) || null;
}

/**
 * Puts an item into the STEP_TYPE table using the supplied input.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input } = ctx.args;
    validateInput(input, ['STEP_TYPE_NAME', 'RESOURCE_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE']);
    
    const insertStatement = insert({
        table: 'STEP_TYPE',
        values: input,
    });
    const DB_SCHEMA = ctx.stash.dbSchema || 'hazel_mapping_dev';
    const selectStatement = `SELECT * FROM ${DB_SCHEMA}.STEP_TYPE ORDER BY STEP_TYPE_ID DESC LIMIT 1`;
    return createMySQLStatement(insertStatement, selectStatement);
}

/**
 * Returns the result or throws an error if the operation failed.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        return util.appendError(
            error.message,
            error.type,
            result
        )
    }
    return safeArrayAccess(result, [1, 0]);
}

