export interface CreateServiceInput {
  SERVICE_PROVIDER_ID: number;
  URI: string;
  CREATED_BY_USER_ID: number;
  CREATED_DATE: string;
}

export interface UpdateServiceInput {
  SERVICE_ID: number;
  SERVICE_PROVIDER_ID?: number;
  URI?: string;
  CHANGED_BY_USER_ID?: number;
  CHANGED_DATE?: string;
}

export interface CreateServiceParamInput {
  SERVICE_ID: number;
  PARAM_NAME: string;
  CREATED_BY_USER_ID: number;
  CREATED_DATE: string;
}

export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}