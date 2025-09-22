import { util } from '@aws-appsync/utils';
import { remove, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Deletes an item with LOAN_APP_ID `ctx.args.input.LOAN_APP_ID` from the LOAN_APP table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { LOAN_APP_ID }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        LOAN_APP_ID: {
            eq: LOAN_APP_ID,
        },
    };
    const selectStatement = select({
        table: 'LOAN_APP',
        columns: '*',
        where,
        limit: 1,
    });
    const deleteStatement = remove({
        table: 'LOAN_APP',
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

