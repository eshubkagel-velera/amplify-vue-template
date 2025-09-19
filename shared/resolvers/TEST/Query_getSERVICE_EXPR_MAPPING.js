import { util } from '@aws-appsync/utils';
import { select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Sends a request to get an item with SERVICE_EXPR_MAPPING_ID `ctx.args.SERVICE_EXPR_MAPPING_ID` from the SERVICE_EXPR_MAPPING table.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { SERVICE_EXPR_MAPPING_ID } = ctx.args;
    const where = {
        SERVICE_EXPR_MAPPING_ID: {
            eq: SERVICE_EXPR_MAPPING_ID,
        },
    };
    const statement = select({
        table: 'SERVICE_EXPR_MAPPING',
        columns: '*',
        where,
        limit: 1,
    });
    return createMySQLStatement(statement)
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

