import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { CONFIG_PARAM_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM CONFIG_PARAM
    WHERE CONFIG_PARAM_ID = ${CONFIG_PARAM_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM CONFIG_PARAM WHERE CONFIG_PARAM_ID = ${CONFIG_PARAM_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}