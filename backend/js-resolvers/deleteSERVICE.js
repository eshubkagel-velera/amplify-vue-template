import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { SERVICE_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM SERVICE
    WHERE SERVICE_ID = ${SERVICE_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM SERVICE WHERE SERVICE_ID = ${SERVICE_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}