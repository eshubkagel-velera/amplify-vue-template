import { util } from '@aws-appsync/utils';
import { insert, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Puts an item into the SERVICE table using the supplied input.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input } = ctx.args;
    const insertStatement = insert({
        table: 'SERVICE',
        values: input,
    });
    const selectStatement = `SELECT SERVICE_ID, SERVICE_PROVIDER_ID, URI, SECRET_NAME, REQUEST_TYPE, CREATED_BY_USER_ID, CREATED_DATE, CHANGED_BY_USER_ID, CHANGED_DATE FROM SERVICE WHERE SERVICE_ID = LAST_INSERT_ID()`;
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
    console.log('SERVICE create result:', JSON.stringify(result));
    const jsonResult = toJsonObject(result);
    console.log('JSON result:', JSON.stringify(jsonResult));
    return jsonResult[1] && jsonResult[1][0] ? jsonResult[1][0] : null;
}

