import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { REDIRECT_URL_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM REDIRECT_URL
    WHERE REDIRECT_URL_ID = ${REDIRECT_URL_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM REDIRECT_URL WHERE REDIRECT_URL_ID = ${REDIRECT_URL_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}