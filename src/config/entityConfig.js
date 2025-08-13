export const ENTITY_CONFIGS = {
  ORIGIN_PRODUCT: {
    hasAuditFields: true,
    hasChangedFields: true,
    skipDateFields: false
  },
  REDIRECT_URL: {
    hasAuditFields: true,
    hasChangedFields: true,
    skipDateFields: false
  },
  SERVICE: {
    hasAuditFields: true,
    hasChangedFields: true,
    skipDateFields: false
  },
  SERVICE_PARAM: {
    hasAuditFields: true,
    hasChangedFields: true,
    skipDateFields: false
  },
  SERVICE_PARAM_MAPPING: {
    hasAuditFields: true,
    hasChangedFields: false,
    skipDateFields: false
  },
  SERVICE_EXPR_MAPPING: {
    hasAuditFields: true,
    hasChangedFields: false,
    skipDateFields: false
  },
  SERVICE_PROVIDER: {
    hasAuditFields: true,
    hasChangedFields: true,
    skipDateFields: false
  },
  STEP_TYPE: {
    hasAuditFields: true,
    hasChangedFields: true,
    skipDateFields: false
  },
  STEP_SERVICE_MAPPING: {
    hasAuditFields: false,
    hasChangedFields: false,
    skipDateFields: true
  }
};

export const getEntityConfig = (entityName) => {
  return ENTITY_CONFIGS[entityName] || {
    hasAuditFields: false,
    hasChangedFields: false,
    skipDateFields: false
  };
};