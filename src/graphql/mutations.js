export const createOriginProduct = `
  mutation CreateOriginProduct($input: CreateORIGIN_PRODUCTInput!) {
    createORIGIN_PRODUCT(input: $input) {
      ORIGIN_PRODUCT_ID
      VENDOR_NAME
      PSCU_CLIENT_ID
      PRODUCT_ID
      PRODUCT_DESC
      PARTNER_CODE
      CREATED_DATE
      CREATED_BY_USER_ID
    }
  }
`;

export const updateOriginProduct = `
  mutation UpdateOriginProduct($input: UpdateORIGIN_PRODUCTInput!, $condition: TableORIGIN_PRODUCTConditionInput) {
    updateORIGIN_PRODUCT(input: $input, condition: $condition) {
      PRODUCT_ID
      PRODUCT_DESC
      PSCU_CLIENT_ID
      PARTNER_CODE
      VENDOR_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const deleteOriginProduct = `
  mutation DeleteOriginProduct($input: DeleteORIGIN_PRODUCTInput!, $condition: TableORIGIN_PRODUCTConditionInput) {
    deleteORIGIN_PRODUCT(input: $input, condition: $condition) {
      CHANGED_BY_USER_ID
      CHANGED_DATE
      PARTNER_CODE
    }
  }
`;

export const createRedirectUrl = `
  mutation CreateRedirectUrl($input: CreateREDIRECT_URLInput!) {
    createREDIRECT_URL(input: $input) {
      REDIRECT_URL_ID
      ORIGIN_PRODUCT_ID
      URL_TYPE_CODE
      URL
      RESPONSE_TEXT
      CREATED_BY_USER_ID
      CREATED_DATE
    }
  }
`;

export const updateRedirectUrl = `
  mutation UpdateRedirectUrl($input: UpdateREDIRECT_URLInput!, $condition: TableREDIRECT_URLConditionInput) {
    updateREDIRECT_URL(input: $input, condition: $condition) {
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
  }
`;

export const deleteRedirectUrl = `
  mutation DeleteRedirectUrl($input: DeleteREDIRECT_URLInput!, $condition: TableREDIRECT_URLConditionInput) {
    deleteREDIRECT_URL(input: $input, condition: $condition) {
      REDIRECT_URL_ID
      ORIGIN_PRODUCT_ID
      URL
    }
  }
`;

export const createServiceProvider = `
  mutation CreateServiceProvider($input: CreateSERVICE_PROVIDERInput!) {
    createSERVICE_PROVIDER(input: $input) {
      SERVICE_PROVIDER_ID
      SERVICE_PROVIDER_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
    }
  }
`;

export const updateServiceProvider = `
  mutation UpdateServiceProvider($input: UpdateSERVICE_PROVIDERInput!, $condition: TableSERVICE_PROVIDERConditionInput) {
    updateSERVICE_PROVIDER(input: $input, condition: $condition) {
      SERVICE_PROVIDER_ID
      SERVICE_PROVIDER_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const deleteServiceProvider = `
  mutation DeleteServiceProvider($input: DeleteSERVICE_PROVIDERInput!, $condition: TableSERVICE_PROVIDERConditionInput) {
    deleteSERVICE_PROVIDER(input: $input, condition: $condition) {
      SERVICE_PROVIDER_ID
      SERVICE_PROVIDER_NAME
    }
  }
`;

export const createService = `
  mutation CreateService($input: CreateSERVICEInput!) {
    createSERVICE(input: $input) {
      SERVICE_ID
      SERVICE_PROVIDER_ID
      URI
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const updateService = `
  mutation UpdateService($input: UpdateSERVICEInput!, $condition: TableSERVICEConditionInput) {
    updateSERVICE(input: $input, condition: $condition) {
      SERVICE_ID
      SERVICE_PROVIDER_ID
      URI
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const deleteService = `
  mutation DeleteService($input: DeleteSERVICEInput!, $condition: TableSERVICEConditionInput) {
    deleteSERVICE(input: $input, condition: $condition) {
      SERVICE_ID
      SERVICE_PROVIDER_ID
      URI
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const createServiceParam = `
  mutation CreateServiceParam($input: CreateSERVICE_PARAMInput!) {
    createSERVICE_PARAM(input: $input) {
      SERVICE_ID
      SERVICE_PARAM_ID
      PARAM_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const updateServiceParam = `
  mutation UpdateServiceParam($input: UpdateSERVICE_PARAMInput!, $condition: TableSERVICE_PARAMConditionInput) {
    updateSERVICE_PARAM(input: $input, condition: $condition) {
      SERVICE_PARAM_ID
      SERVICE_ID
      PARAM_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const deleteServiceParam = `
  mutation DeleteServiceParam($input: DeleteSERVICE_PARAMInput!, $condition: TableSERVICE_PARAMConditionInput) {
    deleteSERVICE_PARAM(input: $input, condition: $condition) {
      SERVICE_PARAM_ID
      SERVICE_ID
      PARAM_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const createServiceParamMapping = `
  mutation CreateServiceParamMapping($input: CreateSERVICE_PARAM_MAPPINGInput!) {
    createSERVICE_PARAM_MAPPING(input: $input) {
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
  }
`;

export const updateServiceParamMapping = `
  mutation UpdateServiceParamMapping($input: UpdateSERVICE_PARAM_MAPPINGInput!, $condition: TableSERVICE_PARAM_MAPPINGConditionInput) {
    updateSERVICE_PARAM_MAPPING(input: $input, condition: $condition) {
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
  }
`;

export const deleteServiceParamMapping = `
  mutation DeleteServiceParamMapping($input: DeleteSERVICE_PARAM_MAPPINGInput!, $condition: TableSERVICE_PARAM_MAPPINGConditionInput) {
    deleteSERVICE_PARAM_MAPPING(input: $input, condition: $condition) {
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
  }
`;

export const createServiceExprMapping = `
  mutation CreateServiceExprMapping($input: CreateSERVICE_EXPR_MAPPINGInput!) {
    createSERVICE_EXPR_MAPPING(input: $input) {
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
  }
`;

export const updateServiceExprMapping = `
  mutation UpdateServiceExprMapping($input: UpdateSERVICE_EXPR_MAPPINGInput!, $condition: TableSERVICE_EXPR_MAPPINGConditionInput) {
    updateSERVICE_EXPR_MAPPING(input: $input, condition: $condition) {
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
  }
`;

export const deleteServiceExprMapping = `
  mutation DeleteServiceExprMapping($input: DeleteSERVICE_EXPR_MAPPINGInput!, $condition: TableSERVICE_EXPR_MAPPINGConditionInput) {
    deleteSERVICE_EXPR_MAPPING(input: $input, condition: $condition) {
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
  }
`;

export const createStepType = `
  mutation CreateStepType($input: CreateSTEP_TYPEInput!) {
    createSTEP_TYPE(input: $input) {
      STEP_TYPE_ID
      STEP_TYPE_NAME
      STEP_TYPE_DESC
      RESOURCE_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const updateStepType = `
  mutation UpdateStepType($input: UpdateSTEP_TYPEInput!, $condition: TableSTEP_TYPEConditionInput) {
    updateSTEP_TYPE(input: $input, condition: $condition) {
      STEP_TYPE_ID
      STEP_TYPE_NAME
      STEP_TYPE_DESC
      RESOURCE_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const deleteStepType = `
  mutation DeleteStepType($input: DeleteSTEP_TYPEInput!, $condition: TableSTEP_TYPEConditionInput) {
    deleteSTEP_TYPE(input: $input, condition: $condition) {
      STEP_TYPE_ID
      STEP_TYPE_NAME
      STEP_TYPE_DESC
      RESOURCE_NAME
      CREATED_BY_USER_ID
      CREATED_DATE
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const createStepServiceMapping = `
  mutation CreateStepServiceMapping($input: CreateSTEP_SERVICE_MAPPINGInput!) {
    createSTEP_SERVICE_MAPPING(input: $input) {
      STEP_SERVICE_MAPPING_ID
      STEP_TYPE_ID
      SERVICE_ID
      SEQUENCE_NBR
    }
  }
`;

export const updateStepServiceMapping = `
  mutation UpdateStepServiceMapping($input: UpdateSTEP_SERVICE_MAPPINGInput!, $condition: TableSTEP_SERVICE_MAPPINGConditionInput) {
    updateSTEP_SERVICE_MAPPING(input: $input, condition: $condition) {
      STEP_SERVICE_MAPPING_ID
      STEP_TYPE_ID
      SERVICE_ID
      SEQUENCE_NBR
    }
  }
`;

export const deleteStepServiceMapping = `
  mutation DeleteStepServiceMapping($input: DeleteSTEP_SERVICE_MAPPINGInput!, $condition: TableSTEP_SERVICE_MAPPINGConditionInput) {
    deleteSTEP_SERVICE_MAPPING(input: $input, condition: $condition) {
      STEP_SERVICE_MAPPING_ID
      STEP_TYPE_ID
      SERVICE_ID
      SEQUENCE_NBR
    }
  }
`;