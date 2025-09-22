import { util } from '@aws-appsync/utils';
import { insert, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Puts an item into the SERVICE_DOMAIN table using the supplied input.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input } = ctx.args;
    const insertStatement = insert({
        table: 'SERVICE_DOMAIN',
        values: input,
    });
    const { SERVICE_DOMAIN_ID } = input;
    const where = {
        SERVICE_DOMAIN_ID: {
            eq: SERVICE_DOMAIN_ID,
        },
    };
    const selectStatement = select({
        table: 'SERVICE_DOMAIN',
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

