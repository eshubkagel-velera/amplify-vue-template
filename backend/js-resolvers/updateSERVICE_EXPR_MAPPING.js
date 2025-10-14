import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const i = ctx.args.input;
  
  // Build dynamic UPDATE statement
  const setPairs = [];
  Object.keys(i).forEach(key => {
    if (key !== 'SERVICE_EXPR_MAPPING_ID' && i[key] !== undefined) {
      setPairs.push(`${key} = COALESCE(${i[key] ?? null}, ${key})`);
    }
  });
  
  const update = sql`
    UPDATE SERVICE_EXPR_MAPPING
    SET ${sql.raw(setPairs.join(', '))}
    WHERE SERVICE_EXPR_MAPPING_ID = ${i.SERVICE_EXPR_MAPPING_ID}
  `;
  
  const select = sql`
    SELECT * FROM SERVICE_EXPR_MAPPING WHERE SERVICE_EXPR_MAPPING_ID = ${i.SERVICE_EXPR_MAPPING_ID}
  `;
  
  return createMySQLStatement(update, select);
}

export function response(ctx) {
  const rows = ctx.result?.[1] ?? [];
  return rows[0] ?? null;
}