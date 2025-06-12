// GraphQL API Types
export interface LOAN_APP {
  CHANGED_DATE?: string;
  CREATED_DATE: string;
  EXEC_ID?: string;
  LOAN_APP_ID: number;
  ORIGIN_LOAN_APP_ID: string;
  ORIGIN_PRODUCT_ID: number;
  PROCESS_FLAG: string;
}

export interface LOAN_APP_EXECS {
  AWS_EXEC_ID: string;
  CREATED_DATE: string;
  LOAN_APP_EXEC_ID: number;
  LOAN_APP_ID: number;
}

export interface LOAN_APP_STEP_STATUS {
  COMPLETE_FLAG: string;
  CREATED_DATE: string;
  LOAN_APP_EXEC_ID?: number;
  LOAN_APP_ID: number;
  LOAN_APP_STEP_STATUS_ID: number;
  OUTPUT_JSON?: string;
  RESPONSE_TEXT?: string;
  STEP_TYPE_ID: number;
}

export interface NEW_MEMBER_TOKEN {
  CHANGED_DATE?: string;
  CREATED_DATE: string;
  CUSTOMER_NBR?: string;
  DOB?: string;
  EMAIL_ADDRESS_TEXT?: string;
  FIRST_NAME?: string;
  HOME_PHONE_NBR?: string;
  LAST_NAME?: string;
  LOAN_APP_ID: number;
  MEMBER_NBR?: string;
  MOBILE_PHONE_NBR?: string;
  NEW_MEMBER_TOKEN_ID: number;
  PERSON_NBR?: string;
  TAX_ID?: string;
  TOKEN_USED_FLAG: string;
  TOKEN_VALUE?: string;
  ZIP_CODE?: string;
}

export interface ORIGIN_PRODUCT {
  CHANGED_BY_USER_ID?: number;
  CHANGED_DATE?: string;
  CREATED_BY_USER_ID: number;
  CREATED_DATE: string;
  ORIGIN_PRODUCT_ID: number;
  PARTNER_CODE?: string;
  PRODUCT_DESC: string;
  PRODUCT_ID: string;
  PSCU_CLIENT_ID: number;
  VENDOR_NAME: string;
}

export interface REDIRECT_URL {
  CHANGED_BY_USER_ID?: number;
  CHANGED_DATE?: string;
  CREATED_BY_USER_ID: number;
  CREATED_DATE: string;
  ORIGIN_PRODUCT_ID: number;
  REDIRECT_URL_ID?: number;
  RESPONSE_TEXT?: string;
  URL: string;
  URL_TYPE_CODE: string;
}

export interface SERVICE {
  CHANGED_BY_USER_ID?: number;
  CHANGED_DATE?: string;
  CREATED_BY_USER_ID: number;
  CREATED_DATE: string;
  SERVICE_ID: number;
  SERVICE_PROVIDER_ID: number;
  URI: string;
}

export interface SERVICE_PROVIDER {
  CHANGED_BY_USER_ID?: number;
  CHANGED_DATE?: string;
  CREATED_BY_USER_ID: number;
  CREATED_DATE: string;
  SERVICE_PROVIDER_ID?: number;
  SERVICE_PROVIDER_NAME: string;
}

export interface STEP_TYPE {
  CHANGED_BY_USER_ID?: number;
  CHANGED_DATE?: string;
  CREATED_BY_USER_ID: number;
  CREATED_DATE: string;
  RESOURCE_NAME: string;
  STEP_TYPE_DESC?: string;
  STEP_TYPE_ID: number;
  STEP_TYPE_NAME: string;
}

// Define the Schema type for the GraphQL client
export type Schema = {
  models: {
    LOAN_APP: {
      primaryKey: 'LOAN_APP_ID';
      type: LOAN_APP;
    };
    ORIGIN_PRODUCT: {
      primaryKey: 'ORIGIN_PRODUCT_ID';
      type: ORIGIN_PRODUCT;
    };
    // Add other models as needed
  };
};