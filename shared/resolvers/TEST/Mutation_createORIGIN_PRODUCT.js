import { util } from '@aws-appsync/utils';
import { insert, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

/**
 * Puts an item into the ORIGIN_PRODUCT table using the supplied input.
 * @param {import('@aws-appsync/utils').Context} ctx the context
 * @returns {*} the request
 */
export function request(ctx) {
    const { input } = ctx.args;

    const insertStatement = insert({
        table: 'ORIGIN_PRODUCT',
        values: input,
    });

    const selectStatement = `SELECT ORIGIN_PRODUCT_ID, VENDOR_NAME, PRODUCT_ID, PSCU_CLIENT_ID, PRODUCT_DESC, PARTNER_CODE, CREATED_BY_USER_ID, CREATED_DATE FROM ORIGIN_PRODUCT WHERE ORIGIN_PRODUCT_ID IN (SELECT MAX(ORIGIN_PRODUCT_ID) FROM ORIGIN_PRODUCT)`;
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

