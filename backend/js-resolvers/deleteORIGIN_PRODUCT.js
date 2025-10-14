import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { ORIGIN_PRODUCT_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM ORIGIN_PRODUCT
    WHERE ORIGIN_PRODUCT_ID = ${ORIGIN_PRODUCT_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM ORIGIN_PRODUCT WHERE ORIGIN_PRODUCT_ID = ${ORIGIN_PRODUCT_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}