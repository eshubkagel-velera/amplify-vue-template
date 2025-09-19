import { util } from '@aws-appsync/utils';
import { select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Sends a request to get an item with SERVICE_PARAM_ID `ctx.args.SERVICE_PARAM_ID` from the SERVICE_PARAM table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { SERVICE_PARAM_ID } = ctx.args;
    const where = {
        SERVICE_PARAM_ID: {
            eq: SERVICE_PARAM_ID,
        },
    };
    const statement = select({
        table: 'SERVICE_PARAM',
        columns: '*',
        where,
        limit: 1,
    });
    return createMySQLStatement(statement)
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
    return toJsonObject(result)[0][0]
}

