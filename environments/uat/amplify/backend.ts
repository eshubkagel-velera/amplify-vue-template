import { defineBackend } from '@aws-amplify/backend';
import { environments } from '../../../shared/config/environments';

const config = environments.uat;

defineBackend({
  // Using existing external GraphQL API
  // No data resource needed - connecting to existing AppSync API
});

export { config };