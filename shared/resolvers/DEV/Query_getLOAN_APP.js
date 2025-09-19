import { util } from '@aws-appsync/utils';
import { select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

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
 * Sends a request to get an item with LOAN_APP_ID `ctx.args.LOAN_APP_ID` from the LOAN_APP table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { LOAN_APP_ID } = ctx.args;
    validateInput({ LOAN_APP_ID }, ['LOAN_APP_ID']);
    
    const where = {
        LOAN_APP_ID: {
            eq: LOAN_APP_ID,
        },
    };
    const statement = select({
        table: 'LOAN_APP',
        columns: '*',
        where,
        limit: 1,
    });
    return createMySQLStatement(statement);
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
    return safeArrayAccess(result, [0, 0]);
}

