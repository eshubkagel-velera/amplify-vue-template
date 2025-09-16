#!/bin/bash
set -e

API_ID="${API_ID:-rxlu3umb3bdhjgswtlwqbsd44m}"
REGION="${REGION:-us-east-2}"

mkdir -p resolvers

echo "Downloading Query resolvers..."
aws appsync list-resolvers --api-id "$API_ID" --type-name Query --region "$REGION" --query "resolvers[].fieldName" --output text | tr '\t' '\n' | while read -r field; do
    aws appsync get-resolver --api-id "$API_ID" --type-name Query --field-name "$field" --region "$REGION" > "resolvers/Query_$field.json" || { echo "Failed to download Query_$field"; exit 1; }
    echo "Downloaded Query_$field.json"
done

echo "Downloading Mutation resolvers..."
aws appsync list-resolvers --api-id "$API_ID" --type-name Mutation --region "$REGION" --query "resolvers[].fieldName" --output text | tr '\t' '\n' | while read -r field; do
    aws appsync get-resolver --api-id "$API_ID" --type-name Mutation --field-name "$field" --region "$REGION" > "resolvers/Mutation_$field.json" || { echo "Failed to download Mutation_$field"; exit 1; }
    echo "Downloaded Mutation_$field.json"
done

echo "Downloading Subscription resolvers..."
aws appsync list-resolvers --api-id "$API_ID" --type-name Subscription --region "$REGION" --query "resolvers[].fieldName" --output text | tr '\t' '\n' | while read -r field; do
    aws appsync get-resolver --api-id "$API_ID" --type-name Subscription --field-name "$field" --region "$REGION" > "resolvers/Subscription_$field.json" || { echo "Failed to download Subscription_$field"; exit 1; }
    echo "Downloaded Subscription_$field.json"
done

echo "All resolvers downloaded to resolvers/ folder"