import { util } from '@aws-appsync/utils';
import { update, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Updates an item in the NEW_MEMBER_TOKEN table, if an item with the given key exists.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { NEW_MEMBER_TOKEN_ID, ...values }, condition = {} } = ctx.args;
    const where = {
        ...condition,
        NEW_MEMBER_TOKEN_ID: {
            eq: NEW_MEMBER_TOKEN_ID,
        },
    };
    const updateStatement = update({
        table: 'NEW_MEMBER_TOKEN',
        values,
        where,
    });
    const selectStatement = select({
        table: 'NEW_MEMBER_TOKEN',
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

