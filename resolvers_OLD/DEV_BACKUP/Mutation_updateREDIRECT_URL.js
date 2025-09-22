import { util } from '@aws-appsync/utils';
import { update, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Updates an item in the REDIRECT_URL table, if an item with the given key exists.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { REDIRECT_URL_ID, ...values }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        REDIRECT_URL_ID: {
            eq: REDIRECT_URL_ID,
        },
    };
    const updateStatement = update({
        table: 'REDIRECT_URL',
        values,
        where,
    });
    const selectStatement = select({
        table: 'REDIRECT_URL',
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

