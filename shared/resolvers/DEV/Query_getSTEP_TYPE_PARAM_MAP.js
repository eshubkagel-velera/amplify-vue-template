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
    const { STEP_TYPE_PARAM_MAP_ID } = ctx.args;
    validateInput({ STEP_TYPE_PARAM_MAP_ID }, ['STEP_TYPE_PARAM_MAP_ID']);
    
    const where = {
        STEP_TYPE_PARAM_MAP_ID: {
            eq: STEP_TYPE_PARAM_MAP_ID,
        },
    };
    const statement = select({
        table: 'STEP_TYPE_PARAM_MAP',
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