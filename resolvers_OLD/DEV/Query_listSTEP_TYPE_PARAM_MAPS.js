import { util } from '@aws-appsync/utils';
import { select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

function optimizeOrderBy(orderByInput) {
  return orderByInput.flatMap(x => Object.entries(x).map(([column, dir]) => ({ column, dir })));
}

export function request(ctx) {
    const { filter = {}, limit = 100, orderBy: orderByInput = [], nextToken } = ctx.args;
    const offset = nextToken ? +util.base64Decode(nextToken) : 0;
    const orderBy = optimizeOrderBy(orderByInput);
    
    const statement = select({
        table: 'STEP_TYPE_PARAM_MAP',
        columns: '*',
        limit,
        offset,
        where: filter,
        orderBy,
    });
    return createMySQLStatement(statement);
}

export function response(ctx) {
    const { args: { limit = 100, nextToken }, error, result } = ctx;
    if (error) {
        return util.appendError(
            error.message,
            error.type,
            result
        );
    }
    const items = toJsonObject(result)[0];
    const endOfResults = items?.length < limit;
    const offset = nextToken ? +util.base64Decode(nextToken) : 0;
    const token = endOfResults ? null : util.base64Encode(`${offset + limit}`);
    return {
        items,
        nextToken: token,
    };
}