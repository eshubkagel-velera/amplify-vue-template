#!/bin/bash

APP_ID="d120tqgz0vig6b"

echo "Removing API keys from app-level environment variables..."

# Update app-level environment variables without API keys
aws amplify update-app --app-id $APP_ID --environment-variables \
  VITE_APPSYNC_REGION=us-east-2,VITE_USER_POOL_ID=us-east-2_iAtP0Uzh5,VITE_USER_POOL_CLIENT_ID=28h9r16c1gnq9v60jc1d5uuo5b,VITE_OAUTH_DOMAIN=velera-hazel-config.auth.us-east-2.amazoncognito.com,VITE_DEV_APPSYNC_ENDPOINT=https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql,VITE_DEV_APPSYNC_API_ID=rxlu3umb3bdhjgswtlwqbsd44m,VITE_TEST_APPSYNC_ENDPOINT=https://duvqljupwfacli45hvfqoi3uni.appsync-api.us-east-2.amazonaws.com/graphql,VITE_TEST_APPSYNC_API_ID=abc4k4lp35bidexf7g4cwaacqm,VITE_UAT_APPSYNC_ENDPOINT=https://uat-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql,VITE_UAT_APPSYNC_API_ID=uat-app-id-placeholder,VITE_PROD_APPSYNC_ENDPOINT=https://live-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql,VITE_PROD_APPSYNC_API_ID=live-app-id-placeholder >/dev/null 2>&1

echo "API keys removed from app-level environment variables"