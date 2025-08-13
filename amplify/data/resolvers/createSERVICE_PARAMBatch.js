import { util } from '@aws-appsync/utils';

export function request(ctx) {
  const items = ctx.args.inputs.map(input => ({
    PutRequest: {
      Item: util.dynamodb.toMapValues({
        ...input,
        SERVICE_PARAM_ID: util.autoId(),
        __typename: 'SERVICE_PARAM'
      })
    }
  }));

  return {
    operation: 'BatchPutItem',
    tables: {
      'SERVICE_PARAM': items
    }
  };
}

export function response(ctx) {
  if (ctx.error) {
    util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result.data['SERVICE_PARAM'] || [];
}