import { util } from '@aws-appsync/utils';
import { remove, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Deletes an item with CONFIG_PARAM_ID `ctx.args.input.CONFIG_PARAM_ID` from the CONFIG_PARAM table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { CONFIG_PARAM_ID }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        CONFIG_PARAM_ID: {
            eq: CONFIG_PARAM_ID,
        },
    };
    const selectStatement = select({
        table: 'CONFIG_PARAM',
        columns: '*',
        where,
        limit: 1,
    });
    const deleteStatement = remove({
        table: 'CONFIG_PARAM',
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

