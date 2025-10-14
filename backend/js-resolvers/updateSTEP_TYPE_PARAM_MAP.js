import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const i = ctx.args.input;
  
  // Build dynamic UPDATE statement
  const setPairs = [];
  Object.keys(i).forEach(key => {
    if (key !== 'STEP_TYPE_PARAM_MAP_ID' && i[key] !== undefined) {
      setPairs.push(`${key} = COALESCE(${i[key] ?? null}, ${key})`);
    }
  });
  
  const update = sql`
    UPDATE STEP_TYPE_PARAM_MAP
    SET ${sql.raw(setPairs.join(', '))}
    WHERE STEP_TYPE_PARAM_MAP_ID = ${i.STEP_TYPE_PARAM_MAP_ID}
  `;
  
  const select = sql`
    SELECT * FROM STEP_TYPE_PARAM_MAP WHERE STEP_TYPE_PARAM_MAP_ID = ${i.STEP_TYPE_PARAM_MAP_ID}
  `;
  
  return createMySQLStatement(update, select);
}

export function response(ctx) {
  const rows = ctx.result?.[1] ?? [];
  return rows[0] ?? null;
}