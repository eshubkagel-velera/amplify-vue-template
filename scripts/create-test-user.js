#!/usr/bin/env node

import { CognitoIdentityProviderClient, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({ region: 'us-east-2' });

const USER_POOL_ID = 'us-east-2_iAtP0Uzh5';
const TEST_PASSWORD = 'DevPass123!';

const TEST_USERS = [
  { username: 'developer-user@velera.com', role: 'developer' }
];

async function setupTestUsers() {
  console.log('Setting up test users for integration tests...');
  
  for (const user of TEST_USERS) {
    try {
      console.log(`\nConfiguring ${user.username} (${user.role})...`);
      
      // Reset password
      await client.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.username,
        Password: TEST_PASSWORD,
        Permanent: true
      }));
      
      // Verify email
      await client.send(new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.username,
        UserAttributes: [
          { Name: 'email_verified', Value: 'true' }
        ]
      }));
      
      console.log(`✅ ${user.username} configured successfully`);
      
    } catch (error) {
      console.error(`❌ Error configuring ${user.username}:`, error.message);
    }
  }
  
  console.log('\n📋 Test Users Ready:');
  TEST_USERS.forEach(user => {
    console.log(`  ${user.username} (${user.role}) - Password: ${TEST_PASSWORD}`);
  });
}

setupTestUsers();