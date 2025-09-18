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

export function request(ctx) {
    const { CONFIG_PARAM_ID } = ctx.args;
    validateInput({ CONFIG_PARAM_ID }, ['CONFIG_PARAM_ID']);
    
    const where = {
        CONFIG_PARAM_ID: {
            eq: CONFIG_PARAM_ID,
        },
    };
    const statement = select({
        table: 'CONFIG_PARAM',
        columns: '*',
        where,
        limit: 1,
    });
    return createMySQLStatement(statement);
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
    return safeArrayAccess(result, [0, 0]);
}