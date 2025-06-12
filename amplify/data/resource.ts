import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
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
