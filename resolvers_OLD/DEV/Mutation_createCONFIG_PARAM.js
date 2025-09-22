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

export function request(ctx) {
    const { input } = ctx.args;
    validateInput(input, ['CONFIG_PARAM_ID', 'CONFIG_NAME', 'CONFIG_VALUE']);
    
    const insertStatement = insert({
        table: 'CONFIG_PARAM',
        values: input,
    });
    const { CONFIG_PARAM_ID } = input;
    const where = {
        CONFIG_PARAM_ID: {
            eq: CONFIG_PARAM_ID,
        },
    };
    const selectStatement = select({
        table: 'CONFIG_PARAM',
        columns: '*',
        where,
        limit: 1,
    });
    return createMySQLStatement(insertStatement, selectStatement);
}

export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        return util.appendError(
            error.message,
            error.type,
            result
        );
    }
    return safeArrayAccess(result, [1, 0]);
}