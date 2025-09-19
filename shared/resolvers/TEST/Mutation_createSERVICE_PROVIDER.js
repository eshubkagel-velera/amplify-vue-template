import { util } from '@aws-appsync/utils';
import { insert, select, createMySQLStatement, toJsonObject } from '@aws-appsync/utils/rds';

export function request(ctx) {
    const { input } = ctx.args;
    const env = ctx.request.headers['x-environment'] || 'test';
    const dbMap = { dev: 'hazel_mapping_dev', test: 'hazel_mapping_test', uat: 'hazel_mapping_uat', live: 'hazel_mapping_live' };
    const dbName = dbMap[env] || 'hazel_mapping_test';
    
    const insertStatement = insert({
        table: `${dbName}.SERVICE_PROVIDER`,
        values: input,
    });
    
    const selectStatement = select({
        table: `${dbName}.SERVICE_PROVIDER`,
        columns: ['SERVICE_PROVIDER_ID', 'SERVICE_PROVIDER_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'],
        where: { SERVICE_PROVIDER_ID: { eq: input.SERVICE_PROVIDER_ID } }
    });
    
    return createMySQLStatement(insertStatement, selectStatement);
}

export function response(ctx) {
    const { error, result } = ctx;
    if (error) {
        return util.appendError(error.message, error.type, result);
    }
    const jsonResult = toJsonObject(result);
    return jsonResult[1] && jsonResult[1][0] ? jsonResult[1][0] : null;
}

