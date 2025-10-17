// Predefined GraphQL mutations to prevent injection attacks
export const CREATE_LOAN_APP = `
  mutation createLOAN_APP($input: CreateLOAN_APPInput!) {
    createLOAN_APP(input: $input) {
      CHANGED_DATE
      CREATED_DATE
      EXEC_ID
      LOAN_APP_ID
      ORIGIN_LOAN_APP_ID
      ORIGIN_PRODUCT_ID
      PROCESS_FLAG
    }
  }
`;

export const UPDATE_LOAN_APP = `
  mutation updateLOAN_APP($input: UpdateLOAN_APPInput!) {
    updateLOAN_APP(input: $input) {
      CHANGED_DATE
      CREATED_DATE
      EXEC_ID
      LOAN_APP_ID
      ORIGIN_LOAN_APP_ID
      ORIGIN_PRODUCT_ID
      PROCESS_FLAG
    }
  }
`;

export const DELETE_LOAN_APP = `
  mutation deleteLOAN_APP($input: DeleteLOAN_APPInput!) {
    deleteLOAN_APP(input: $input) {
      LOAN_APP_ID
    }
  }
`;

export const CREATE_ORIGIN_PRODUCT = `
  mutation createORIGIN_PRODUCT($input: CreateORIGIN_PRODUCTInput!) {
    createORIGIN_PRODUCT(input: $input) {
      ORIGIN_PRODUCT_ID
      VENDOR_NAME
      PRODUCT_ID
      PSCU_CLIENT_ID
      PRODUCT_DESC
      PARTNER_CODE
      CREATED_BY_USER_ID
      CREATED_DATE
    }
  }
`;

export const UPDATE_ORIGIN_PRODUCT = `
  mutation updateORIGIN_PRODUCT($input: UpdateORIGIN_PRODUCTInput!) {
    updateORIGIN_PRODUCT(input: $input) {
      ORIGIN_PRODUCT_ID
    }
  }
`;

export const DELETE_ORIGIN_PRODUCT = `
  mutation deleteORIGIN_PRODUCT($input: DeleteORIGIN_PRODUCTInput!) {
    deleteORIGIN_PRODUCT(input: $input) {
      ORIGIN_PRODUCT_ID
    }
  }
`;

export const CREATE_SERVICE_PARAM_MAPPING = `
  mutation createSERVICE_PARAM_MAPPING($input: CreateSERVICE_PARAM_MAPPINGInput!) {
    createSERVICE_PARAM_MAPPING(input: $input) {
      SERVICE_PARAM_MAPPING_ID
      ORIGIN_PRODUCT_ID
      SOURCE_SERVICE_PARAM_ID
      TARGET_SERVICE_PARAM_ID
      CREATED_BY_USER_ID
      CREATED_DATE
    }
  }
`;

export const CREATE_SERVICE_EXPR_MAPPING = `
  mutation createSERVICE_EXPR_MAPPING($input: CreateSERVICE_EXPR_MAPPINGInput!) {
    createSERVICE_EXPR_MAPPING(input: $input) {
      SERVICE_EXPR_MAPPING_ID
      SERVICE_PARAM_MAPPING_ID
      SOURCE_EXPR
      TARGET_EXPR
      CREATED_BY_USER_ID
      CREATED_DATE
    }
  }
`;

export const CREATE_SERVICE = `
  mutation createSERVICE($input: CreateSERVICEInput!) {
    createSERVICE(input: $input) {
      SERVICE_ID
      SERVICE_PROVIDER_ID
      URI
      CREATED_DATE
    }
  }
`;

export const CREATE_SERVICE_PARAM = `
  mutation createSERVICE_PARAM($input: CreateSERVICE_PARAMInput!) {
    createSERVICE_PARAM(input: $input) {
      SERVICE_PARAM_ID
      SERVICE_ID
      PARAM_NAME
      CREATED_DATE
    }
  }
`;