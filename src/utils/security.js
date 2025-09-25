// Security utilities for environment protection

export const isProductionEnvironment = (operationName) => {
  return operationName.includes('_UAT') || operationName.includes('_LIVE');
};

export const confirmProductionOperation = (operationName, environment) => {
  if (isProductionEnvironment(operationName)) {
    const confirmed = window.confirm(
      `⚠️ WARNING: You are about to perform a ${operationName} operation on ${environment} environment.\n\nThis could affect live data. Are you sure you want to continue?`
    );
    return confirmed;
  }
  return true;
};

export const getEnvironmentClass = (operationName) => {
  if (operationName.includes('_LIVE')) return 'env-live';
  if (operationName.includes('_UAT')) return 'env-uat';
  if (operationName.includes('_TEST')) return 'env-test';
  return 'env-dev';
};