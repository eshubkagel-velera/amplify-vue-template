import { util } from '@aws-appsync/utils';
import { remove, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Deletes an item with SERVICE_ID `ctx.args.input.SERVICE_ID` from the SERVICE table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { SERVICE_ID }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        SERVICE_ID: {
            eq: SERVICE_ID,
        },
    };
    const selectStatement = select({
        table: 'SERVICE',
        columns: '*',
        where,
        limit: 1,
    });
    const deleteStatement = remove({
        table: 'SERVICE',
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

