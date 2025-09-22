import { util } from '@aws-appsync/utils';
import { update, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Updates an item in the STEP_SERVICE_MAPPING table, if an item with the given key exists.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { STEP_SERVICE_MAPPING_ID, ...values }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        STEP_SERVICE_MAPPING_ID: {
            eq: STEP_SERVICE_MAPPING_ID,
        },
    };
    const updateStatement = update({
        table: 'STEP_SERVICE_MAPPING',
        values,
        where,
    });
    const selectStatement = select({
        table: 'STEP_SERVICE_MAPPING',
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

