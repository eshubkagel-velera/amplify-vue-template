import { util } from '@aws-appsync/utils';
import { update, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Updates an item in the LOAN_APP_STEP_STATUS table, if an item with the given key exists.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { LOAN_APP_STEP_STATUS_ID, ...values }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        LOAN_APP_STEP_STATUS_ID: {
            eq: LOAN_APP_STEP_STATUS_ID,
        },
    };
    const updateStatement = update({
        table: 'LOAN_APP_STEP_STATUS',
        values,
        where,
    });
    const selectStatement = select({
        table: 'LOAN_APP_STEP_STATUS',
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

