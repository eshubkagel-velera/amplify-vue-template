import { util } from '@aws-appsync/utils';
import { select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Sends a request to get an item with REDIRECT_URL_ID `ctx.args.REDIRECT_URL_ID` from the REDIRECT_URL table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { REDIRECT_URL_ID } = ctx.args;
    const where = {
        REDIRECT_URL_ID: {
            eq: REDIRECT_URL_ID,
        },
    };
    const statement = select({
        table: 'REDIRECT_URL',
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

