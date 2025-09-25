import { util } from '@aws-appsync/utils';
import { insert, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Puts an item into the SERVICE_PARAM table using the supplied input.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input } = ctx.args;
    const insertStatement = insert({
        table: 'SERVICE_PARAM',
        values: input,
    });
    const selectStatement = `SELECT SERVICE_PARAM_ID, SERVICE_ID, PARAM_NAME, CREATED_BY_USER_ID, CREATED_DATE, CHANGED_BY_USER_ID, CHANGED_DATE FROM SERVICE_PARAM WHERE SERVICE_PARAM_ID IN (SELECT MAX(SERVICE_PARAM_ID) FROM SERVICE_PARAM)`;
    return createMySQLStatement(insertStatement, selectStatement)
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

