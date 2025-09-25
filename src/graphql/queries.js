export const listOriginProducts = `
  query ListOriginProducts {
    listORIGIN_PRODUCTS {
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
  query ListRedirectUrls {
    listREDIRECT_URLS {
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
      }
      nextToken
    }
  }
`;

export const listServiceProviders = `
  query ListServiceProviders {
    listSERVICE_PROVIDERS {
      items {
        SERVICE_PROVIDER_ID
        SERVICE_PROVIDER_NAME
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listServices = `
  query ListServices {
    listSERVICES {
      items {
        SERVICE_ID
        SERVICE_PROVIDER_ID
        URI
        SECRET_NAME
        REQUEST_TYPE
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
  query ListServiceParams {
    listSERVICE_PARAMS {
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
  query ListServiceParamMappings {
    listSERVICE_PARAM_MAPPINGS {
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
  query ListServiceExprMappings {
    listSERVICE_EXPR_MAPPINGS {
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
  query ListStepTypes {
    listSTEP_TYPES {
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
  query ListStepServiceMappings {
    listSTEP_SERVICE_MAPPINGS {
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