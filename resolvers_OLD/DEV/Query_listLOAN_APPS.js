import { util } from '@aws-appsync/utils';
import { select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

function optimizeOrderBy(orderByInput) {
  return orderByInput.flatMap(x => Object.entries(x).map(([column, dir]) => ({ column, dir })));
}

/**
 * Lists items in the table. Lists up to the provided `limit` and starts from the provided `nextToken` (optional).
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { filter = {}, limit = 100, orderBy: orderByInput = [], nextToken } = ctx.args;
    const offset = nextToken ? +util.base64Decode(nextToken) : 0;
    const orderBy = optimizeOrderBy(orderByInput);
    const statement = select({
        table: 'LOAN_APP',
        columns: '*',
        limit,
        offset,
        where: filter,
        orderBy,
    });
    return createMySQLStatement(statement);
}

/**
 * Returns the result or throws an error if the operation failed.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the result
 */
export function response(ctx) {
    const { args: { limit = 100, nextToken }, error, result } = ctx;
    if (error) {
        return util.appendError(
            error.message,
            error.type,
            result
        )
    }
    const items = toJsonObject(result)[0];
    const endOfResults = items?.length < limit;
    const token = endOfResults ? null : util.base64Encode(`${offset + limit}`);
    return {
        items,
        nextToken: token,
    }
}

