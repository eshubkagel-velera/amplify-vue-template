import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const i = ctx.args.input;
  
  // Build dynamic UPDATE statement
  const setPairs = [];
  Object.keys(i).forEach(key => {
    if (key !== 'ORIGIN_PRODUCT_ID' && i[key] !== undefined) {
      setPairs.push(`${key} = COALESCE(${i[key] ?? null}, ${key})`);
    }
  });
  
  const update = sql`
    UPDATE ORIGIN_PRODUCT
    SET ${sql.raw(setPairs.join(', '))}
    WHERE ORIGIN_PRODUCT_ID = ${i.ORIGIN_PRODUCT_ID}
  `;
  
  const select = sql`
    SELECT * FROM ORIGIN_PRODUCT WHERE ORIGIN_PRODUCT_ID = ${i.ORIGIN_PRODUCT_ID}
  `;
  
  return createMySQLStatement(update, select);
}

export function response(ctx) {
  const rows = ctx.result?.[1] ?? [];
  return rows[0] ?? null;
}