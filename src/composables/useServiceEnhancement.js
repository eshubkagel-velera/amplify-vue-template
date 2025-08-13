import { getClient } from '../client.js';
import * as queries from '../graphql/queries';

export const useServiceEnhancement = () => {
  const enhanceServiceParams = async (serviceParams) => {
    try {
      const [servicesResult, providersResult] = await Promise.all([
        getClient().graphql({ query: queries.listServices }),
        getClient().graphql({ query: queries.listServiceProviders })
      ]);
      
      const services = servicesResult.data.listSERVICES.items;
      const providers = providersResult.data.listSERVICE_PROVIDERS.items;
      
      return serviceParams.map(param => {
        const service = services.find(s => s.SERVICE_ID === param.SERVICE_ID);
        if (service) {
          const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
          return {
            ...param,
            SERVICE_DISPLAY: `${param.SERVICE_ID}: ${service.URI} - ${provider?.SERVICE_PROVIDER_NAME || 'Unknown'}`
          };
        }
        return param;
      });
    } catch (error) {
      console.error('Error enhancing service params:', error);
      return serviceParams;
    }
  };

  const loadServiceOptions = async () => {
    try {
      const [servicesResult, providersResult] = await Promise.all([
        getClient().graphql({ query: queries.listServices }),
        getClient().graphql({ query: queries.listServiceProviders })
      ]);
      
      const services = servicesResult.data.listSERVICES.items;
      const providers = providersResult.data.listSERVICE_PROVIDERS.items;
      
      return services.map(service => {
        const provider = providers.find(p => p.SERVICE_PROVIDER_ID === service.SERVICE_PROVIDER_ID);
        return {
          value: service.SERVICE_ID,
          label: `${service.SERVICE_ID}: ${service.URI} - ${provider?.SERVICE_PROVIDER_NAME || 'Unknown'}`
        };
      });
    } catch (error) {
      console.error('Error loading service options:', error);
      return [];
    }
  };

  return {
    enhanceServiceParams,
    loadServiceOptions
  };
};