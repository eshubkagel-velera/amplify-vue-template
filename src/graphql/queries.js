export const listConfigParams = `
  query ListConfigParams {
    listCONFIG_PARAMS {
      items {
        CONFIG_PARAM_ID
        CONFIG_NAME
        CONFIG_VALUE
        DESCRIPTION
        CREATED_DATE
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listFilterCriterias = `
  query ListFilterCriterias {
    listFILTER_CRITERIAS {
      items {
        FILTER_CRITERIA_ID
        ORIGIN_PRODUCT_ID
        STEP_TYPE_ID
        CRITERIA
        SEQUENCE_NBR
        CREATED_DATE
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listLoanApps = `
  query ListLoanApps {
    listLOAN_APPS {
      items {
        LOAN_APP_ID
        ORIGIN_LOAN_APP_ID
        ORIGIN_PRODUCT_ID
        PROCESS_FLAG
        EXEC_ID
        CREATED_DATE
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listLoanAppExecs = `
  query ListLoanAppExecs {
    listLOAN_APP_EXECS {
      items {
        LOAN_APP_EXEC_ID
        LOAN_APP_ID
        AWS_EXEC_ID
        CREATED_DATE
      }
      nextToken
    }
  }
`;

export const listLoanAppStepStatus = `
  query ListLoanAppStepStatus {
    listLOAN_APP_STEP_STATUS {
      items {
        LOAN_APP_STEP_STATUS_ID
        LOAN_APP_ID
        LOAN_APP_EXEC_ID
        STEP_TYPE_ID
        COMPLETE_FLAG
        SEQUENCE_NBR
        IDX_JSON_PATH
        RESPONSE_TEXT
        OUTPUT_JSON
        CREATED_DATE
      }
      nextToken
    }
  }
`;

export const listNewMemberTokens = `
  query ListNewMemberTokens {
    listNEW_MEMBER_TOKENS {
      items {
        NEW_MEMBER_TOKEN_ID
        MEMBER_NBR
        CARD_NBR
        PERSON_NBR
        LOAN_APP_ID
        FIRST_NAME
        LAST_NAME
        DOB
        TAX_ID
        EMAIL_ADDRESS_TEXT
        ZIP_CODE
        HOME_PHONE_NBR
        MOBILE_PHONE_NBR
        TOKEN_VALUE
        TOKEN_USED_FLAG
        CREATED_DATE
        CHANGED_DATE
      }
      nextToken
    }
  }
`;

export const listOriginProducts = `
  query ListOriginProducts {
    listORIGIN_PRODUCTS {
      items {
        ORIGIN_PRODUCT_ID
        VENDOR_NAME
        PRODUCT_ID
        PSCU_CLIENT_ID
        PRODUCT_DESC
        PARTNER_CODE
        CREATED_BY_USER_ID
        CREATED_DATE
        CHANGED_BY_USER_ID
        CHANGED_DATE
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

export const listServiceDomains = `
  query ListServiceDomains {
    listSERVICE_DOMAINS {
      items {
        SERVICE_DOMAIN_ID
        DOMAIN_URL
        SERVICE_PROVIDER_ID
        CREATED_DATE
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

export const listSortCriterias = `
  query ListSortCriterias {
    listSORT_CRITERIAS {
      items {
        SORT_CRITERIA_ID
        ORIGIN_PRODUCT_ID
        STEP_TYPE_ID
        JSON_PATH
        SORT_ORDER
        SORT_PRIORITY
        SEQUENCE_NBR
        CREATED_DATE
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

export const listStepTypeParamMaps = `
  query ListStepTypeParamMaps {
    listSTEP_TYPE_PARAM_MAPS {
      items {
        STEP_TYPE_PARAM_MAP_ID
        STEP_TYPE_ID
        SERVICE_PARAM_MAPPING_ID
        CREATED_BY_USER_ID
        CREATED_DATE
      }
      nextToken
    }
  }
`;

