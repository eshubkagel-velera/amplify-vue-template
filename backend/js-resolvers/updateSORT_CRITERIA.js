import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const i = ctx.args.input;
  
  // Build dynamic UPDATE statement
  const setPairs = [];
  Object.keys(i).forEach(key => {
    if (key !== 'SORT_CRITERIA_ID' && i[key] !== undefined) {
      setPairs.push(`${key} = COALESCE(${i[key] ?? null}, ${key})`);
    }
  });
  
  const update = sql`
    UPDATE SORT_CRITERIA
    SET ${sql.raw(setPairs.join(', '))}
    WHERE SORT_CRITERIA_ID = ${i.SORT_CRITERIA_ID}
  `;
  
  const select = sql`
    SELECT * FROM SORT_CRITERIA WHERE SORT_CRITERIA_ID = ${i.SORT_CRITERIA_ID}
  `;
  
  return createMySQLStatement(update, select);
}

export function response(ctx) {
  const rows = ctx.result?.[1] ?? [];
  return rows[0] ?? null;
}