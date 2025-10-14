import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { SERVICE_PROVIDER_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM SERVICE_PROVIDER
    WHERE SERVICE_PROVIDER_ID = ${SERVICE_PROVIDER_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM SERVICE_PROVIDER WHERE SERVICE_PROVIDER_ID = ${SERVICE_PROVIDER_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}