import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const items = ctx.args.inputs.map(input => ({
    PutRequest: {
      Item: util.dynamodb.toMapValues({
        ...input,
        SERVICE_EXPR_MAPPING_ID: util.autoId()
      })
    }
  }));

  return {
    operation: 'BatchWriteItem',
    requestMappings: {
      'SERVICE_EXPR_MAPPING': items
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  
  const items = ctx.args.inputs.map((input, index) => ({
    ...input,
    SERVICE_EXPR_MAPPING_ID: ctx.result.unprocessedItems ? null : (index + 1)
  }));
  
  return {
    items,
    errors: ctx.result.unprocessedItems ? ['Some items failed'] : []
  };
}