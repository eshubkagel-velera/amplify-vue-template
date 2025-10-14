import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { FILTER_CRITERIA_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM FILTER_CRITERIA
    WHERE FILTER_CRITERIA_ID = ${FILTER_CRITERIA_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM FILTER_CRITERIA WHERE FILTER_CRITERIA_ID = ${FILTER_CRITERIA_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}