import { sql, createMySQLStatement } from '@aws-appsync/utils/rds';

export function request(ctx) {
  const { SORT_CRITERIA_ID } = ctx.args.input;
  
  const preimage = sql`
    SELECT * FROM SORT_CRITERIA
    WHERE SORT_CRITERIA_ID = ${SORT_CRITERIA_ID}
    LIMIT 1
  `;
  
  const del = sql`DELETE FROM SORT_CRITERIA WHERE SORT_CRITERIA_ID = ${SORT_CRITERIA_ID}`;
  
  return createMySQLStatement(preimage, del);
}

export function response(ctx) {
  const pre = ctx.result?.[0] ?? [];
  return pre[0] ?? null;
}