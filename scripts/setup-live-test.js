#!/usr/bin/env node

// Setup script for live GraphQL testing
// This configures the environment and authentication for the live test

import fs from 'fs';
import path from 'path';

const envTemplate = `# Live Test Environment Configuration
TEST_ENVIRONMENT=dev

# GraphQL Endpoints
VITE_DEV_GRAPHQL_URL=https://c752hk5zybdrjkrbp7wtswor5u.appsync-api.us-east-2.amazonaws.com/graphql
VITE_TEST_GRAPHQL_URL=https://rbzam3y7gbaovfcg4exjfkkski.appsync-api.us-east-2.amazonaws.com/graphql
VITE_UAT_GRAPHQL_URL=https://ues6gxmtcfev5kkxxzukxmx2ti.appsync-api.us-east-2.amazonaws.com/graphql
VITE_LIVE_GRAPHQL_URL=https://iadfbdeokzdxnaiol2fbb56l2a.appsync-api.us-east-2.amazonaws.com/graphql

# AWS Configuration
VITE_APPSYNC_REGION=us-east-2
VITE_USER_POOL_ID=us-east-2_iAtP0Uzh5
VITE_USER_POOL_CLIENT_ID=28h9r16c1gnq9v60jc1d5uuo5b
VITE_OAUTH_DOMAIN=velera-hazel-config.auth.us-east-2.amazoncognito.com

# Database Names
VITE_DB_NAME_DEV=hazel_mapping_dev
VITE_DB_NAME_TEST=hazel_mapping_test
VITE_DB_NAME_UAT=hazel_mapping_uat
VITE_DB_NAME_LIVE=hazel_mapping_live

# Test User Credentials (create a test user in Cognito)
TEST_USERNAME=your-test-username
TEST_PASSWORD=your-test-password
`;

console.log('🔧 Setting up Live GraphQL Test Environment...\n');

// Create .env.test file if it doesn't exist
const envTestPath = '.env.test';
if (!fs.existsSync(envTestPath)) {
  fs.writeFileSync(envTestPath, envTemplate);
  console.log(`✅ Created ${envTestPath}`);
  console.log('📝 Please edit this file with your actual configuration values\n');
} else {
  console.log(`⚠️  ${envTestPath} already exists\n`);
}

console.log('📋 Setup Instructions:');
console.log('1. Edit .env.test with your GraphQL endpoints and Cognito config');
console.log('2. Create a test user in AWS Cognito');
console.log('3. Run: npm run test:live');
console.log('\n🚀 The live test will use your actual frontend GraphQL client functions!');