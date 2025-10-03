#!/bin/bash

echo "Deploying to all environments..."

echo "Deploying DEV environment..."
npx serverless deploy --stage dev

echo "Deploying TEST environment..."
npx serverless deploy --stage test

echo "Deploying UAT environment..."
npx serverless deploy --stage UAT

echo "Deploying LIVE environment..."
npx serverless deploy --stage live

echo "All environments deployed!"