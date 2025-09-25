#!/bin/bash

echo "Deploying to all environments..."

echo "Deploying DEV environment..."
npx serverless deploy --stage dev

echo "Deploying TEST environment..."
npx serverless deploy --stage test

echo "Deploying PROD environment..."
npx serverless deploy --stage prod

echo "All environments deployed!"