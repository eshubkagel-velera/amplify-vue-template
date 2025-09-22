import { util } from '@aws-appsync/utils';
import { remove, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Deletes an item with NEW_MEMBER_TOKEN_ID `ctx.args.input.NEW_MEMBER_TOKEN_ID` from the NEW_MEMBER_TOKEN table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input: { NEW_MEMBER_TOKEN_ID }, condition = {} } = ctx.args;
    const where = {
        ...condition,
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
    const deleteStatement = remove({
        table: 'NEW_MEMBER_TOKEN',
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

