import { util } from '@aws-appsync/utils';
import { remove, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Deletes an item with STEP_TYPE_ID `ctx.args.input.STEP_TYPE_ID` from the STEP_TYPE table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { STEP_TYPE_ID }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        STEP_TYPE_ID: {
            eq: STEP_TYPE_ID,
        },
    };
    const selectStatement = select({
        table: 'STEP_TYPE',
        columns: '*',
        where,
        limit: 1,
    });
    const deleteStatement = remove({
        table: 'STEP_TYPE',
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

