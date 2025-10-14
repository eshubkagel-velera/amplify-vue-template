import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { SERVICE_PARAM_MAPPING_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM SERVICE_PARAM_MAPPING
    WHERE SERVICE_PARAM_MAPPING_ID = ${SERVICE_PARAM_MAPPING_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM SERVICE_PARAM_MAPPING WHERE SERVICE_PARAM_MAPPING_ID = ${SERVICE_PARAM_MAPPING_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}