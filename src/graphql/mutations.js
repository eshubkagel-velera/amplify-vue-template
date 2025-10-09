export const createConfigParam = `
  mutation CreateConfigParam($input: CreateCONFIG_PARAMInput!) {
    createCONFIG_PARAM(input: $input) {
      CONFIG_PARAM_ID
      CONFIG_NAME
      CONFIG_VALUE
      DESCRIPTION
      CREATED_DATE
      CHANGED_DATE
    }
  }
`;

export const updateConfigParam = `
  mutation UpdateConfigParam($input: UpdateCONFIG_PARAMInput!) {
    updateCONFIG_PARAM(input: $input) {
      CONFIG_PARAM_ID
      CONFIG_NAME
      CONFIG_VALUE
      DESCRIPTION
      CREATED_DATE
      CHANGED_DATE
    }
  }
`;

export const deleteConfigParam = `
  mutation DeleteConfigParam($input: DeleteCONFIG_PARAMInput!) {
    deleteCONFIG_PARAM(input: $input) {
      CONFIG_PARAM_ID
    }
  }
`;

export const createFilterCriteria = `
  mutation CreateFilterCriteria($input: CreateFILTER_CRITERIAInput!) {
    createFILTER_CRITERIA(input: $input) {
      FILTER_CRITERIA_ID
      ORIGIN_PRODUCT_ID
      STEP_TYPE_ID
      CRITERIA
      SEQUENCE_NBR
      CREATED_DATE
      CHANGED_DATE
    }
  }
`;

export const updateFilterCriteria = `
  mutation UpdateFilterCriteria($input: UpdateFILTER_CRITERIAInput!) {
    updateFILTER_CRITERIA(input: $input) {
      FILTER_CRITERIA_ID
      ORIGIN_PRODUCT_ID
      STEP_TYPE_ID
      CRITERIA
      SEQUENCE_NBR
      CREATED_DATE
      CHANGED_DATE
    }
  }
`;

export const deleteFilterCriteria = `
  mutation DeleteFilterCriteria($input: DeleteFILTER_CRITERIAInput!) {
    deleteFILTER_CRITERIA(input: $input) {
      FILTER_CRITERIA_ID
    }
  }
`;

export const createOriginProduct = `
  mutation CreateOriginProduct($input: CreateORIGIN_PRODUCTInput!) {
    createORIGIN_PRODUCT(input: $input) {
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
  }
`;

export const updateOriginProduct = `
  mutation UpdateOriginProduct($input: UpdateORIGIN_PRODUCTInput!) {
    updateORIGIN_PRODUCT(input: $input) {
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
  }
`;

export const deleteOriginProduct = `
  mutation DeleteOriginProduct($input: DeleteORIGIN_PRODUCTInput!) {
    deleteORIGIN_PRODUCT(input: $input) {
      ORIGIN_PRODUCT_ID
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
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const updateRedirectUrl = `
  mutation UpdateRedirectUrl($input: UpdateREDIRECT_URLInput!) {
    updateREDIRECT_URL(input: $input) {
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
  mutation DeleteRedirectUrl($input: DeleteREDIRECT_URLInput!) {
    deleteREDIRECT_URL(input: $input) {
      REDIRECT_URL_ID
    }
  }
`;

export const createService = `
  mutation CreateService($input: CreateSERVICEInput!) {
    createSERVICE(input: $input) {
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
  }
`;

export const updateService = `
  mutation UpdateService($input: UpdateSERVICEInput!) {
    updateSERVICE(input: $input) {
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
  }
`;

export const deleteService = `
  mutation DeleteService($input: DeleteSERVICEInput!) {
    deleteSERVICE(input: $input) {
      SERVICE_ID
    }
  }
`;

export const createServiceDomain = `
  mutation CreateServiceDomain($input: CreateSERVICE_DOMAINInput!) {
    createSERVICE_DOMAIN(input: $input) {
      SERVICE_DOMAIN_ID
      DOMAIN_URL
      SERVICE_PROVIDER_ID
      CREATED_DATE
      CHANGED_DATE
    }
  }
`;

export const updateServiceDomain = `
  mutation UpdateServiceDomain($input: UpdateSERVICE_DOMAINInput!) {
    updateSERVICE_DOMAIN(input: $input) {
      SERVICE_DOMAIN_ID
      DOMAIN_URL
      SERVICE_PROVIDER_ID
      CREATED_DATE
      CHANGED_DATE
    }
  }
`;

export const deleteServiceDomain = `
  mutation DeleteServiceDomain($input: DeleteSERVICE_DOMAINInput!) {
    deleteSERVICE_DOMAIN(input: $input) {
      SERVICE_DOMAIN_ID
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
  mutation UpdateServiceExprMapping($input: UpdateSERVICE_EXPR_MAPPINGInput!) {
    updateSERVICE_EXPR_MAPPING(input: $input) {
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
  mutation DeleteServiceExprMapping($input: DeleteSERVICE_EXPR_MAPPINGInput!) {
    deleteSERVICE_EXPR_MAPPING(input: $input) {
      SERVICE_EXPR_MAPPING_ID
    }
  }
`;

export const createServiceParam = `
  mutation CreateServiceParam($input: CreateSERVICE_PARAMInput!) {
    createSERVICE_PARAM(input: $input) {
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

export const updateServiceParam = `
  mutation UpdateServiceParam($input: UpdateSERVICE_PARAMInput!) {
    updateSERVICE_PARAM(input: $input) {
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
  mutation DeleteServiceParam($input: DeleteSERVICE_PARAMInput!) {
    deleteSERVICE_PARAM(input: $input) {
      SERVICE_PARAM_ID
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
  mutation UpdateServiceParamMapping($input: UpdateSERVICE_PARAM_MAPPINGInput!) {
    updateSERVICE_PARAM_MAPPING(input: $input) {
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
  mutation DeleteServiceParamMapping($input: DeleteSERVICE_PARAM_MAPPINGInput!) {
    deleteSERVICE_PARAM_MAPPING(input: $input) {
      SERVICE_PARAM_MAPPING_ID
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
      CHANGED_BY_USER_ID
      CHANGED_DATE
    }
  }
`;

export const updateServiceProvider = `
  mutation UpdateServiceProvider($input: UpdateSERVICE_PROVIDERInput!) {
    updateSERVICE_PROVIDER(input: $input) {
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
  mutation DeleteServiceProvider($input: DeleteSERVICE_PROVIDERInput!) {
    deleteSERVICE_PROVIDER(input: $input) {
      SERVICE_PROVIDER_ID
    }
  }
`;

export const createSortCriteria = `
  mutation CreateSortCriteria($input: CreateSORT_CRITERIAInput!) {
    createSORT_CRITERIA(input: $input) {
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
  }
`;

export const updateSortCriteria = `
  mutation UpdateSortCriteria($input: UpdateSORT_CRITERIAInput!) {
    updateSORT_CRITERIA(input: $input) {
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
  }
`;

export const deleteSortCriteria = `
  mutation DeleteSortCriteria($input: DeleteSORT_CRITERIAInput!) {
    deleteSORT_CRITERIA(input: $input) {
      SORT_CRITERIA_ID
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
  mutation UpdateStepServiceMapping($input: UpdateSTEP_SERVICE_MAPPINGInput!) {
    updateSTEP_SERVICE_MAPPING(input: $input) {
      STEP_SERVICE_MAPPING_ID
      STEP_TYPE_ID
      SERVICE_ID
      SEQUENCE_NBR
    }
  }
`;

export const deleteStepServiceMapping = `
  mutation DeleteStepServiceMapping($input: DeleteSTEP_SERVICE_MAPPINGInput!) {
    deleteSTEP_SERVICE_MAPPING(input: $input) {
      STEP_SERVICE_MAPPING_ID
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
  mutation UpdateStepType($input: UpdateSTEP_TYPEInput!) {
    updateSTEP_TYPE(input: $input) {
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
  mutation DeleteStepType($input: DeleteSTEP_TYPEInput!) {
    deleteSTEP_TYPE(input: $input) {
      STEP_TYPE_ID
    }
  }
`;

export const createStepTypeParamMap = `
  mutation CreateStepTypeParamMap($input: CreateSTEP_TYPE_PARAM_MAPInput!) {
    createSTEP_TYPE_PARAM_MAP(input: $input) {
      STEP_TYPE_PARAM_MAP_ID
      STEP_TYPE_ID
      SERVICE_PARAM_MAPPING_ID
      CREATED_BY_USER_ID
      CREATED_DATE
    }
  }
`;

export const updateStepTypeParamMap = `
  mutation UpdateStepTypeParamMap($input: UpdateSTEP_TYPE_PARAM_MAPInput!) {
    updateSTEP_TYPE_PARAM_MAP(input: $input) {
      STEP_TYPE_PARAM_MAP_ID
      STEP_TYPE_ID
      SERVICE_PARAM_MAPPING_ID
      CREATED_BY_USER_ID
      CREATED_DATE
    }
  }
`;

export const deleteStepTypeParamMap = `
  mutation DeleteStepTypeParamMap($input: DeleteSTEP_TYPE_PARAM_MAPInput!) {
    deleteSTEP_TYPE_PARAM_MAP(input: $input) {
      STEP_TYPE_PARAM_MAP_ID
    }
  }
`;

