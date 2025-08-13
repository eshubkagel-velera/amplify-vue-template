export interface OriginProduct {
  ORIGIN_PRODUCT_ID: number;
  PRODUCT_ID: string;
  PSCU_CLIENT_ID: string;
  PARTNER_CODE: string;
  PRODUCT_DESC: string;
  VENDOR_NAME: string;
  CREATED_DATE: string;
  CREATED_BY_USER_ID: number;
  CHANGED_DATE?: string;
  CHANGED_BY_USER_ID?: number;
}

export interface ServiceProvider {
  SERVICE_PROVIDER_ID: number;
  SERVICE_PROVIDER_NAME: string;
  CREATED_DATE: string;
  CREATED_BY_USER_ID: number;
  CHANGED_DATE?: string;
  CHANGED_BY_USER_ID?: number;
}

export interface Service {
  SERVICE_ID: number;
  SERVICE_PROVIDER_ID: number;
  URI: string;
  CREATED_DATE: string;
  CREATED_BY_USER_ID: number;
}

export interface ServiceParam {
  SERVICE_PARAM_ID: number;
  SERVICE_ID: number;
  PARAM_NAME: string;
  CREATED_DATE: string;
  CREATED_BY_USER_ID: number;
}

export interface ServiceParamMapping {
  SERVICE_PARAM_MAPPING_ID: number;
  ORIGIN_PRODUCT_ID: number;
  SOURCE_SERVICE_PARAM_ID: number;
  TARGET_SERVICE_PARAM_ID: number;
  SYSTEM_NBR: string;
  PRIN_NBR: string;
  AGENT_NBR: string;
  CREATED_DATE: string;
  CREATED_BY_USER_ID: number;
}

export interface RedirectUrl {
  REDIRECT_URL_ID: number;
  ORIGIN_PRODUCT_ID: number;
  URL_TYPE_CODE: 'E' | 'N';
  URL: string;
  RESPONSE_TEXT?: string;
  CREATED_DATE: string;
  CREATED_BY_USER_ID: number;
  CHANGED_DATE?: string;
  CHANGED_BY_USER_ID?: number;
}

export interface StepType {
  STEP_TYPE_ID: number;
  STEP_TYPE_NAME: string;
  STEP_TYPE_DESC?: string;
  RESOURCE_NAME: string;
  CREATED_DATE: string;
  CREATED_BY_USER_ID: number;
}

export interface FormField {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  disabled: boolean;
  options?: { value: any; label: string }[];
}