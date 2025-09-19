import { util } from '@aws-appsync/utils';
import { insert, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Puts an item into the NEW_MEMBER_TOKEN table using the supplied input.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input } = ctx.args;
    const insertStatement = insert({
        table: 'NEW_MEMBER_TOKEN',
        values: input,
    });
    const { NEW_MEMBER_TOKEN_ID } = input;
    const where = {
        NEW_MEMBER_TOKEN_ID: {
            eq: NEW_MEMBER_TOKEN_ID,
        },
    };
    const selectStatement = select({
        table: 'NEW_MEMBER_TOKEN',
        columns: '*',
        where,
        limit: 1,
    });
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

