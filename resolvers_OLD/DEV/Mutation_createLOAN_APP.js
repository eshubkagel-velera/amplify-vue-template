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
 * Puts an item into the LOAN_APP table using the supplied input.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input } = ctx.args;
    validateInput(input, ['LOAN_APP_ID', 'ORIGIN_LOAN_APP_ID', 'ORIGIN_PRODUCT_ID', 'PROCESS_FLAG', 'CREATED_DATE']);
    
    const insertStatement = insert({
        table: 'LOAN_APP',
        values: input,
    });
    const { LOAN_APP_ID } = input;
    const where = {
        LOAN_APP_ID: {
            eq: LOAN_APP_ID,
        },
    };
    const selectStatement = select({
        table: 'LOAN_APP',
        columns: '*',
        where,
        limit: 1,
    });
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

