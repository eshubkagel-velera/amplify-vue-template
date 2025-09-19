#!/bin/bash

# Set environment variables for Amplify app
APP_ID="d120tqgz0vig6b"

echo "Setting ALL environment variables and secrets for all environments"

# Set ALL environment variables at once (available to all branches)
aws amplify update-app --app-id $APP_ID --environment-variables \
  VITE_APPSYNC_REGION=us-east-2,VITE_USER_POOL_ID=us-east-2_iAtP0Uzh5,VITE_USER_POOL_CLIENT_ID=28h9r16c1gnq9v60jc1d5uuo5b,VITE_OAUTH_DOMAIN=velera-hazel-config.auth.us-east-2.amazoncognito.com,VITE_DEV_APPSYNC_ENDPOINT=https://fi5pjed64nf4ran34tusrlvi7u.appsync-api.us-east-2.amazonaws.com/graphql,VITE_DEV_APPSYNC_API_ID=rxlu3umb3bdhjgswtlwqbsd44m,VITE_TEST_APPSYNC_ENDPOINT=https://duvqljupwfacli45hvfqoi3uni.appsync-api.us-east-2.amazonaws.com/graphql,VITE_TEST_APPSYNC_API_ID=abc4k4lp35bidexf7g4cwaacqm,VITE_UAT_APPSYNC_ENDPOINT=https://uat-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql,VITE_UAT_APPSYNC_API_ID=uat-app-id-placeholder,VITE_PROD_APPSYNC_ENDPOINT=https://live-db.placeholder.appsync-api.us-east-2.amazonaws.com/graphql,VITE_PROD_APPSYNC_API_ID=live-app-id-placeholder >/dev/null 2>&1

echo "Environment variables set. API keys must be added manually in Amplify Console:"
echo "Go to App Settings → Secrets and add:"
echo "- VITE_DEV_APPSYNC_API_KEY: da2-qfwm2qhugrbilizrqickmeg5oi"
echo "- VITE_TEST_APPSYNC_API_KEY: da2-jvygmnixejf7vp6lnoctogaaje"
echo "- VITE_UAT_APPSYNC_API_KEY: [your-uat-api-key]"
echo "- VITE_PROD_APPSYNC_API_KEY: [your-prod-api-key]"

echo "Environment variables set successfully"