import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const results = [];
  
  for (const input of ctx.args.inputs) {
    const id = util.autoId();
    results.push({
      operation: 'PutItem',
      key: util.dynamodb.toMapValues({ SERVICE_PARAM_MAPPING_ID: id }),
      attributeValues: util.dynamodb.toMapValues({
        ...input,
        SERVICE_PARAM_MAPPING_ID: id
      })
    });
  }
  
  return results[0]; // Return first operation for now
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  return {
    items: [ctx.result],
    errors: []
  };
}