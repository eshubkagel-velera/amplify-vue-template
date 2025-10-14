#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

if (!global.fetch) {
  const { default: fetch } = await import('node-fetch');
  global.fetch = fetch;
}

async function getAuthToken() {
  const username = process.env.TEST_USERNAME;
  const password = process.env.TEST_PASSWORD;
  
  const authUrl = `https://cognito-idp.us-east-2.amazonaws.com/`;
  
  const authResponse = await fetch(authUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
    },
    body: JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: process.env.VITE_USER_POOL_CLIENT_ID,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    })
  });
  
  const authResult = await authResponse.json();
  return authResult.AuthenticationResult.AccessToken;
}

async function testSimpleCreate() {
  console.log('🔍 Testing Simple CREATE with unique name...\n');
  
  const uniqueName = `TEST_SIMPLE_${Date.now()}`;
  
  const mutation = `
    mutation TestCreate($input: CreateCONFIG_PARAMInput!) {
      createCONFIG_PARAM(input: $input) {
        CONFIG_PARAM_ID
        CONFIG_NAME
        CONFIG_VALUE
        DESCRIPTION
      }
    }
  `;
  
  const input = {
    CONFIG_NAME: uniqueName,
    CONFIG_VALUE: 'test_value',
    DESCRIPTION: 'Simple test'
  };
  
  try {
    const token = await getAuthToken();
    const endpoint = process.env.VITE_DEV_GRAPHQL_URL;
    
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify({ query: mutation, variables: { input } })
    }).then(res => res.json());
    
    console.log('📋 GraphQL Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.data?.createCONFIG_PARAM) {
      const record = result.data.createCONFIG_PARAM;
      console.log('\n✅ Created Record:');
      console.log(`   ID: ${record.CONFIG_PARAM_ID}`);
      console.log(`   Name: ${record.CONFIG_NAME}`);
      
      // Now try to find it with a query
      const queryMutation = `
        query {
          listCONFIG_PARAMS {
            items {
              CONFIG_PARAM_ID
              CONFIG_NAME
              CONFIG_VALUE
            }
          }
        }
      `;
      
      const queryResult = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ query: queryMutation })
      }).then(res => res.json());
      
      const foundRecord = queryResult.data?.listCONFIG_PARAMS?.items?.find(
        item => item.CONFIG_NAME === uniqueName
      );
      
      if (foundRecord) {
        console.log(`\n✅ Found in database with ID: ${foundRecord.CONFIG_PARAM_ID}`);
        console.log('🔍 The INSERT worked, but LAST_INSERT_ID() failed to return it');
      } else {
        console.log('\n❌ Record not found in database - INSERT may have failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleCreate();