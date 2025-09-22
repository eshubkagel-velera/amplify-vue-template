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
    const { SERVICE_DOMAIN_ID } = ctx.args;
    validateInput({ SERVICE_DOMAIN_ID }, ['SERVICE_DOMAIN_ID']);
    
    const where = {
        SERVICE_DOMAIN_ID: {
            eq: SERVICE_DOMAIN_ID,
        },
    };
    const statement = select({
        table: 'SERVICE_DOMAIN',
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