import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  createSERVICE_PARAMBatch: a
    .mutation()
    .arguments({ inputs: a.ref('CreateSERVICE_PARAMInput').array().required() })
    .returns(a.ref('SERVICE_PARAM').array())
    .authorization((allow) => [allow.publicApiKey()]),

  createSERVICE_PARAM_MAPPINGBatch: a
    .mutation()
    .arguments({ inputs: a.ref('CreateSERVICE_PARAM_MAPPINGInput').array().required() })
    .returns(a.ref('SERVICE_PARAM_MAPPING').array())
    .authorization((allow) => [allow.publicApiKey()]),

  createSERVICE_EXPR_MAPPINGBatch: a
    .mutation()
    .arguments({ inputs: a.ref('CreateSERVICE_EXPR_MAPPINGInput').array().required() })
    .returns(a.ref('SERVICE_EXPR_MAPPING').array())
    .authorization((allow) => [allow.publicApiKey()]),

  updateSERVICE_PARAMBatch: a
    .mutation()
    .arguments({ inputs: a.ref('UpdateSERVICE_PARAMInput').array().required() })
    .returns(a.ref('SERVICE_PARAM').array())
    .authorization((allow) => [allow.publicApiKey()]),
  LOAN_APP: a
    .model({
      LOAN_APP_ID: a.id().required(),
      ORIGIN_LOAN_APP_ID: a.string().required(),
      ORIGIN_PRODUCT_ID: a.integer().required(),
      PROCESS_FLAG: a.string().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_DATE: a.string(),
      EXEC_ID: a.string()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  ORIGIN_PRODUCT: a
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
    .authorization((allow) => [allow.publicApiKey()]),

  SERVICE: a
    .model({
      SERVICE_ID: a.id().required(),
      SERVICE_PROVIDER_ID: a.integer().required(),
      URI: a.string().required(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  SERVICE_PARAM: a
    .model({
      SERVICE_PARAM_ID: a.id().required(),
      SERVICE_ID: a.integer().required(),
      PARAM_NAME: a.string().required(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  SERVICE_PARAM_MAPPING: a
    .model({
      SERVICE_PARAM_MAPPING_ID: a.id().required(),
      ORIGIN_PRODUCT_ID: a.integer().required(),
      SOURCE_SERVICE_PARAM_ID: a.integer().required(),
      TARGET_SERVICE_PARAM_ID: a.integer().required(),
      SYSTEM_NBR: a.string(),
      PRIN_NBR: a.string(),
      AGENT_NBR: a.string(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required()
    })
    .authorization((allow) => [allow.publicApiKey()]),

  SERVICE_EXPR_MAPPING: a
    .model({
      SERVICE_EXPR_MAPPING_ID: a.id().required(),
      SERVICE_PARAM_MAPPING_ID: a.integer().required(),
      SOURCE_EXPR: a.string(),
      TARGET_EXPR: a.string(),
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required()
    })
    .authorization((allow) => [allow.publicApiKey()])
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

});
