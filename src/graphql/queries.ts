// Predefined GraphQL queries to prevent injection attacks
export const GET_LOAN_APP = `
  query getLOAN_APP($id: Int!) {
    getLOAN_APP(LOAN_APP_ID: $id) {
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

export const LIST_LOAN_APPS = `
  query listLOAN_APPS {
    listLOAN_APPS {
      items {
        CHANGED_DATE
        CREATED_DATE
        EXEC_ID
        LOAN_APP_ID
        ORIGIN_LOAN_APP_ID
        ORIGIN_PRODUCT_ID
        PROCESS_FLAG
      }
    }
  }
`;

export const GET_ORIGIN_PRODUCT = `
  query getORIGIN_PRODUCT($id: Int!) {
    getORIGIN_PRODUCT(ORIGIN_PRODUCT_ID: $id) {
      CHANGED_BY_USER_ID
      CHANGED_DATE
      CREATED_BY_USER_ID
      CREATED_DATE
      ORIGIN_PRODUCT_ID
      PARTNER_CODE
      PRODUCT_DESC
      PRODUCT_ID
      PSCU_CLIENT_ID
      VENDOR_NAME
    }
  }
`;

export const LIST_ORIGIN_PRODUCTS = `
  query listORIGIN_PRODUCTS {
    listORIGIN_PRODUCTS {
      nextToken
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
    }
  }
`;

export const LIST_SERVICE_PROVIDERS = `
  query listSERVICE_PROVIDERS {
    listSERVICE_PROVIDERS {
      items {
        SERVICE_PROVIDER_ID
        SERVICE_PROVIDER_NAME
        CREATED_DATE
        CREATED_BY_USER_ID
        CHANGED_DATE
        CHANGED_BY_USER_ID
      }
    }
  }
`;

export const LIST_SERVICES = `
  query listSERVICES {
    listSERVICES {
      items {
        SERVICE_ID
        SERVICE_PROVIDER_ID
        URI
        CREATED_DATE
        CREATED_BY_USER_ID
        CHANGED_DATE
        CHANGED_BY_USER_ID
      }
    }
  }
`;

export const LIST_SERVICE_PARAMS = `
  query listSERVICE_PARAMS {
    listSERVICE_PARAMS {
      items {
        SERVICE_PARAM_ID
        SERVICE_ID
        PARAM_NAME
        PARAM_TYPE
        PARAM_VALUE
        CREATED_DATE
        CREATED_BY_USER_ID
        CHANGED_DATE
        CHANGED_BY_USER_ID
      }
    }
  }
`;