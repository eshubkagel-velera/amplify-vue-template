import { ref, onUnmounted } from 'vue';
import { generateClient } from 'aws-amplify/api';
import * as subscriptions from '../graphql/subscriptions';

export const useSubscriptions = (entityName, onDataChange) => {
  const client = generateClient();
  const activeSubscriptions = ref([]);

  const startSubscriptions = () => {
    console.log(`Starting subscriptions for ${entityName}`);
    
    try {
      if (entityName === 'ORIGIN_PRODUCT') {
        // Subscribe to creates
        const createSub = client.graphql({ 
          query: subscriptions.onCreateOriginProduct 
        }).subscribe({
          next: (data) => {
            console.log('Subscription: ORIGIN_PRODUCT created', data.data.onCreateOriginProduct);
            onDataChange('create', data.data.onCreateOriginProduct);
          },
          error: (error) => console.error('Create subscription error:', error)
        });

        // Subscribe to updates
        const updateSub = client.graphql({ 
          query: subscriptions.onUpdateOriginProduct 
        }).subscribe({
          next: (data) => {
            console.log('Subscription: ORIGIN_PRODUCT updated', data.data.onUpdateOriginProduct);
            onDataChange('update', data.data.onUpdateOriginProduct);
          },
          error: (error) => console.error('Update subscription error:', error)
        });

        // Subscribe to deletes
        const deleteSub = client.graphql({ 
          query: subscriptions.onDeleteOriginProduct 
        }).subscribe({
          next: (data) => {
            console.log('Subscription: ORIGIN_PRODUCT deleted', data.data.onDeleteOriginProduct);
            onDataChange('delete', data.data.onDeleteOriginProduct);
          },
          error: (error) => console.error('Delete subscription error:', error)
        });

        activeSubscriptions.value.push(createSub, updateSub, deleteSub);
      }
      
      // Add other entity types as needed
      if (entityName === 'SERVICE') {
        const createSub = client.graphql({ 
          query: subscriptions.onCreateService 
        }).subscribe({
          next: (data) => onDataChange('create', data.data.onCreateService),
          error: (error) => console.error('Service create subscription error:', error)
        });

        const updateSub = client.graphql({ 
          query: subscriptions.onUpdateService 
        }).subscribe({
          next: (data) => onDataChange('update', data.data.onUpdateService),
          error: (error) => console.error('Service update subscription error:', error)
        });

        const deleteSub = client.graphql({ 
          query: subscriptions.onDeleteService 
        }).subscribe({
          next: (data) => onDataChange('delete', data.data.onDeleteService),
          error: (error) => console.error('Service delete subscription error:', error)
        });

        activeSubscriptions.value.push(createSub, updateSub, deleteSub);
      }

    } catch (error) {
      console.error('Error starting subscriptions:', error);
    }
  };

  const stopSubscriptions = () => {
    console.log(`Stopping subscriptions for ${entityName}`);
    activeSubscriptions.value.forEach(subscription => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    activeSubscriptions.value = [];
  };

  // Auto cleanup on unmount
  onUnmounted(() => {
    stopSubscriptions();
  });

  return { startSubscriptions, stopSubscriptions };
};