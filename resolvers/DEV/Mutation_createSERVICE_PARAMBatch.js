import { util } from '@aws-appsync/utils';function validateInput(input, requiredFields) {  for (const field of requiredFields) {    if (!input[field]) {      util.error(`Missing required field: ${field}`, 'ValidationError');    }  }}

export function request(ctx) {
  const { inputs } = ctx.args;  if (!Array.isArray(inputs)) {    util.error('inputs must be an array', 'ValidationError');  }    const allowedFields = ['SERVICE_ID', 'PARAM_NAME', 'CREATED_BY_USER_ID', 'CREATED_DATE', 'CHANGED_BY_USER_ID', 'CHANGED_DATE'];    const items = inputs.map(input => {    validateInput(input, ['SERVICE_ID', 'PARAM_NAME']);    const sanitizedInput = {};    allowedFields.forEach(field => {      if (input[field] !== undefined) sanitizedInput[field] = input[field];    });        return {
    PutRequest: {
      Item: util.dynamodb.toMapValues({
        ...sanitizedInput,
        SERVICE_PARAM_ID: util.autoId(),
        __typename: 'SERVICE_PARAM'
      })
    }
    };  });

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
