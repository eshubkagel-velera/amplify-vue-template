export const listOriginProducts = `
  query ListOriginProducts($filter: TableOrigin_productsFilterInput, $limit: Int, $nextToken: String) {
    listOrigin_products(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        ORIGIN_PRODUCT_ID
        VENDOR_NAME
        PSCU_CLIENT_ID
        PRODUCT_ID
        PRODUCT_DESC
        PARTNER_CODE
        CREATED_DATE
        CREATED_BY_USER_ID
        CHANGED_DATE
        CHANGED_BY_USER_ID
      }
      nextToken
    }
  }
`;

export const listRedirectUrls = `
  query ListRedirectUrls($filter: TableRedirect_urlsFilterInput, $limit: Int, $nextToken: String) {
    listRedirect_urls(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        REDIRECT_URL_ID
        ORIGIN_PRODUCT_ID
        URL_TYPE_CODE
        URL
        RESPONSE_TEXT
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
        PRODUCT_ID
        VENDOR_NAME
      }
      nextToken
    }
  }
`;

export const listServiceProviders = `
  query ListServiceProviders {
    listSERVICE_PROVIDERS {
      SERVICE_PROVIDER_ID
      SERVICE_PROVIDER_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const listServices = `
  query ListServices($filter: TableSERVICEFilterInput, $limit: Int, $nextToken: String) {
    listSERVICES(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        SERVICE_ID
        SERVICE_PROVIDER_ID
        URI
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listServiceParams = `
  query ListServiceParams($filter: TableSERVICE_PARAMFilterInput, $limit: Int, $nextToken: String) {
    listSERVICE_PARAMS(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        SERVICE_PARAM_ID
        SERVICE_ID
        PARAM_NAME
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listServiceParamMappings = `
  query ListServiceParamMappings($filter: TableSERVICE_PARAM_MAPPINGFilterInput, $limit: Int, $nextToken: String) {
    listSERVICE_PARAM_MAPPINGS(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        SERVICE_PARAM_MAPPING_ID
        ORIGIN_PRODUCT_ID
        SYSTEM_NBR
        PRIN_NBR
        AGENT_NBR
        SOURCE_SERVICE_PARAM_ID
        TARGET_SERVICE_PARAM_ID
        PLASTIC_TYPE_ID
        COMMENT_TEXT
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listServiceExprMappings = `
  query ListServiceExprMappings($filter: TableSERVICE_EXPR_MAPPINGFilterInput, $limit: Int, $nextToken: String) {
    listSERVICE_EXPR_MAPPINGS(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        SERVICE_EXPR_MAPPING_ID
        SERVICE_PARAM_MAPPING_ID
        SOURCE_EXPR
        TARGET_EXPR
        COMMENT_TEXT
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listStepTypes = `
  query ListStepTypes($filter: TableSTEP_TYPEFilterInput, $limit: Int, $nextToken: String) {
    listSTEP_TYPES(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        STEP_TYPE_ID
        STEP_TYPE_NAME
        STEP_TYPE_DESC
        RESOURCE_NAME
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listStepServiceMappings = `
  query ListStepServiceMappings($filter: TableSTEP_SERVICE_MAPPINGFilterInput, $limit: Int, $nextToken: String) {
    listSTEP_SERVICE_MAPPINGS(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        STEP_SERVICE_MAPPING_ID
        STEP_TYPE_ID
        SERVICE_ID
        SEQUENCE_NBR
      }
      nextToken
    }
  }
`;

export const listServiceParamMappingsView = `
  query ListServiceParamMappingsView($filter: TableService_param_mappingsFilterInput, $limit: Int, $nextToken: String) {
    listService_param_mappings(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        SERVICE_PARAM_MAPPING_ID
        ORIGIN_PRODUCT_ID
        VENDOR_NAME
        PRODUCT_ID
        PSCU_CLIENT_ID
        PRODUCT_DESC
        PARTNER_CODE
        SOURCE_PROVIDER_ID
        SOURCE_PROVIDER_NAME
        SOURCE_SERVICE_ID
        SOURCE_SERVICE_URI
        SOURCE_PARAM_ID
        SOURCE_PARAM_NAME
        SOURCE_EXPR
        TARGET_PROVIDER_ID
        TARGET_PROVIDER_NAME
        TARGET_SERVICE_ID
        TARGET_SERVICE_URI
        TARGET_EXPR
        TARGET_PARAM_ID
        TARGET_PARAM_NAME
        SYSTEM_NBR
        PRIN_NBR
        AGENT_NBR
        SERVICE_EXPR_MAPPING_ID
      }
      nextToken
    }
  }
`;

export const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      types {
        name
        kind
        description
        fields {
          name
          type {
            name
            kind
            ofType {
              name
              kind
            }
          }
          description
        }
      }
    }
  }
`;