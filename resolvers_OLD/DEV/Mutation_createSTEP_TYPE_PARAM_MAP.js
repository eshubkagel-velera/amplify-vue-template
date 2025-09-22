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
    validateInput(input, ['STEP_TYPE_PARAM_MAP_ID', 'SERVICE_PARAM_MAPPING_ID']);
    
    const insertStatement = insert({
        table: 'STEP_TYPE_PARAM_MAP',
        values: input,
    });
    const { STEP_TYPE_PARAM_MAP_ID } = input;
    const where = {
        STEP_TYPE_PARAM_MAP_ID: {
            eq: STEP_TYPE_PARAM_MAP_ID,
        },
    };
    const selectStatement = select({
        table: 'STEP_TYPE_PARAM_MAP',
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