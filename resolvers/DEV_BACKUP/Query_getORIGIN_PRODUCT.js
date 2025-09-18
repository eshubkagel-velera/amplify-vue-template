import { util } from '@aws-appsync/utils';
import { select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Sends a request to get an item with ORIGIN_PRODUCT_ID `ctx.args.ORIGIN_PRODUCT_ID` from the ORIGIN_PRODUCT table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { ORIGIN_PRODUCT_ID } = ctx.args;
    const where = {
        ORIGIN_PRODUCT_ID: {
            eq: ORIGIN_PRODUCT_ID,
        },
    };
    const statement = select({
        table: 'ORIGIN_PRODUCT',
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

