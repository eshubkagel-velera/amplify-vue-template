import { util } from '@aws-appsync/utils';
import { remove, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Deletes an item with REDIRECT_URL_ID `ctx.args.input.REDIRECT_URL_ID` from the REDIRECT_URL table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { REDIRECT_URL_ID }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        REDIRECT_URL_ID: {
            eq: REDIRECT_URL_ID,
        },
    };
    const selectStatement = select({
        table: 'REDIRECT_URL',
        columns: '*',
        where,
        limit: 1,
    });
    const deleteStatement = remove({
        table: 'REDIRECT_URL',
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

