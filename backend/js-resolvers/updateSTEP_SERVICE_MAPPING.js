import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const i = ctx.args.input;
  
  // Build dynamic UPDATE statement
  const setPairs = [];
  Object.keys(i).forEach(key => {
    if (key !== 'STEP_SERVICE_MAPPING_ID' && i[key] !== undefined) {
      setPairs.push(`${key} = COALESCE(${i[key] ?? null}, ${key})`);
    }
  });
  
  const update = sql`
    UPDATE STEP_SERVICE_MAPPING
    SET ${sql.raw(setPairs.join(', '))}
    WHERE STEP_SERVICE_MAPPING_ID = ${i.STEP_SERVICE_MAPPING_ID}
  `;
  
  const select = sql`
    SELECT * FROM STEP_SERVICE_MAPPING WHERE STEP_SERVICE_MAPPING_ID = ${i.STEP_SERVICE_MAPPING_ID}
  `;
  
  return createMySQLStatement(update, select);
}

export function response(ctx) {
  const rows = ctx.result?.[1] ?? [];
  return rows[0] ?? null;
}