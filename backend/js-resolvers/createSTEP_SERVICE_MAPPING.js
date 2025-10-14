import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const i = ctx.args.input;
  
  // Build dynamic INSERT statement
  const fields = [];
  const values = [];
  
  Object.keys(i).forEach(key => {
    if (i[key] !== null && i[key] !== undefined) {
      fields.push(key);
      values.push(i[key]);
    }
  });
  
  const insert = sql`
    INSERT INTO STEP_SERVICE_MAPPING (${sql.raw(fields.join(', '))})
    VALUES (${values})
  `;
  
  const select = sql`
    SELECT * FROM STEP_SERVICE_MAPPING WHERE STEP_SERVICE_MAPPING_ID = LAST_INSERT_ID()
  `;
  
  return createMySQLStatement(insert, select);
}

export function response(ctx) {
  const rows = ctx.result?.[1] ?? [];
  return rows[0] ?? null;
}