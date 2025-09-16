import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
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
      allow.publicApiKey()
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
      CREATED_BY_USER_ID: a.integer().required(),
      CREATED_DATE: a.string().required(),
      CHANGED_BY_USER_ID: a.integer(),
      CHANGED_DATE: a.string(),
      environment: a.string().default('dev')
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
});
