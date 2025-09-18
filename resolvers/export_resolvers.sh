#!/bin/bash

API_ID="$1"
OUTPUT_DIR="${2:-resolvers}"

if [ -z "$API_ID" ]; then
  echo "Usage: $0 <API_ID> [OUTPUT_DIR]"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

for TYPE in Query Mutation Subscription; do
  echo "Exporting $TYPE resolvers..."
  
  aws appsync list-resolvers --api-id "$API_ID" --type-name "$TYPE" --query 'resolvers[].fieldName' --output text | tr '\t' '\n' | while read -r FIELD; do
    if [ -n "$FIELD" ]; then
      echo "  Exporting $TYPE.$FIELD"
      aws appsync get-resolver --api-id "$API_ID" --type-name "$TYPE" --field-name "$FIELD" --query 'resolver.code' --output text > "$OUTPUT_DIR/${TYPE}_${FIELD}.js"
    fi
  done
done

echo "Export complete. Resolvers saved to $OUTPUT_DIR/"