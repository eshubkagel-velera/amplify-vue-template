import { util } from '@aws-appsync/utils';
import { remove, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Deletes an item with ORIGIN_PRODUCT_ID `ctx.args.input.ORIGIN_PRODUCT_ID` from the ORIGIN_PRODUCT table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { ORIGIN_PRODUCT_ID }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        ORIGIN_PRODUCT_ID: {
            eq: ORIGIN_PRODUCT_ID,
        },
    };
    const selectStatement = select({
        table: 'ORIGIN_PRODUCT',
        columns: '*',
        where,
        limit: 1,
    });
    const deleteStatement = remove({
        table: 'ORIGIN_PRODUCT',
        where,
    });
    return createMySQLStatement(selectStatement, deleteStatement)
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

