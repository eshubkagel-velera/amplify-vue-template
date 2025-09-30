import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // External API query with validation
  externalQuery: a
    .query()
    .arguments({
      environment: a.string().required(),
      query: a.string().required(),
      variables: a.json()
    })
    .returns(a.json())
    .handler(a.handler.function('externalApi'))
    .authorization((allow) => [allow.publicApiKey()]),

  LoanApp: a
    .model({
      LOAN_APP_ID: a.id().required(),
      ORIGIN_LOAN_APP_ID: a.string().required(),
      ORIGIN_PRODUCT_ID: a.integer().required(),
      PROCESS_FLAG: a.string().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_DATE: a.string(),
      EXEC_ID: a.string(),
      environment: a.string().default('dev')
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  OriginProduct: a
    .model({
      ORIGIN_PRODUCT_ID: a.id().required(),
      PRODUCT_ID: a.string().required(),
      PRODUCT_DESC: a.string().required(),
      VENDOR_NAME: a.string().required(),
      PSCU_CLIENT_ID: a.integer().required(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string(),
      PARTNER_CODE: a.string()
    })
    .authorization((allow) => [
      allow.publicApiKey(),
      allow.publicApiKey().to(['subscribe'])
    ]),

  ServiceProvider: a
    .model({
      SERVICE_PROVIDER_ID: a.id().required(),
      SERVICE_PROVIDER_NAME: a.string().required(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string()
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  Service: a
    .model({
      SERVICE_ID: a.id().required(),
      SERVICE_PROVIDER_ID: a.integer().required(),
      URI: a.string().required(),
      SECRET_NAME: a.string(),
      REQUEST_TYPE: a.string(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string(),
      environment: a.string().default('dev')
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  RedirectUrl: a
    .model({
      REDIRECT_URL_ID: a.id().required(),
      ORIGIN_PRODUCT_ID: a.integer().required(),
      URL_TYPE_CODE: a.string().required(),
      URL: a.string().required(),
      RESPONSE_TEXT: a.string(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string()
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  ServiceParam: a
    .model({
      SERVICE_PARAM_ID: a.id().required(),
      SERVICE_ID: a.integer().required(),
      PARAM_NAME: a.string().required(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string()
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  ServiceParamMapping: a
    .model({
      SERVICE_PARAM_MAPPING_ID: a.id().required(),
      ORIGIN_PRODUCT_ID: a.integer().required(),
      SOURCE_SERVICE_PARAM_ID: a.integer().required(),
      TARGET_SERVICE_PARAM_ID: a.integer().required(),
      SYSTEM_NBR: a.string(),
      PRIN_NBR: a.string(),
      AGENT_NBR: a.string(),
      PLASTIC_TYPE_ID: a.string(),
      COMMENT_TEXT: a.string(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string()
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  ServiceExprMapping: a
    .model({
      SERVICE_EXPR_MAPPING_ID: a.id().required(),
      SERVICE_PARAM_MAPPING_ID: a.integer().required(),
      SOURCE_EXPR: a.string(),
      TARGET_EXPR: a.string(),
      COMMENT_TEXT: a.string(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string()
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  StepType: a
    .model({
      STEP_TYPE_ID: a.id().required(),
      STEP_TYPE_NAME: a.string().required(),
      STEP_TYPE_DESC: a.string(),
      RESOURCE_NAME: a.string().required(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string()
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ]),

  StepServiceMapping: a
    .model({
      STEP_SERVICE_MAPPING_ID: a.id().required(),
      STEP_TYPE_ID: a.integer().required(),
      SERVICE_ID: a.integer().required(),
      SEQUENCE_NBR: a.integer()
    })
    .authorization((allow) => [
      allow.publicApiKey()
    ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
  name: "HazelMappingAPI"
});
