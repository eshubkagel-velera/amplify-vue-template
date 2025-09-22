import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { externalApi } from './functions/external-api/resource';

defineBackend({
  auth,
  data,
  externalApi,
});
