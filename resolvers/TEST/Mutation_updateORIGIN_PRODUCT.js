import { util } from '@aws-appsync/utils';
import { update, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Updates an item in the ORIGIN_PRODUCT table, if an item with the given key exists.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { ORIGIN_PRODUCT_ID, ...values }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        ORIGIN_PRODUCT_ID: {
            eq: ORIGIN_PRODUCT_ID,
        },
    };
    const updateStatement = update({
        table: 'ORIGIN_PRODUCT',
        values,
        where,
    });
    const selectStatement = select({
        table: 'ORIGIN_PRODUCT',
        columns: '*',
        where,
        limit: 1,
    });
    return createMySQLStatement(updateStatement, selectStatement)
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
    return toJsonObject(result)[1][0]
}

