#!/bin/bash
API_ID="fi5pjed64nf4ran34tusrlvi7u"
REGION="us-east-2"

echo "Updating key resolvers..."

echo "Updating listLOAN_APPS resolver..."
code=$(powershell -Command "(Get-Content 'resolvers/Query_listLOAN_APPS.json' | ConvertFrom-Json).resolver.code")
aws appsync update-resolver --api-id $API_ID --type-name Query --field-name listLOAN_APPS --region $REGION --code "$code" --runtime name=APPSYNC_JS,runtimeVersion=1.0.0

echo "Updating listORIGIN_PRODUCTS resolver..."
code=$(powershell -Command "(Get-Content 'resolvers/Query_listORIGIN_PRODUCTS.json' | ConvertFrom-Json).resolver.code")
aws appsync update-resolver --api-id $API_ID --type-name Query --field-name listORIGIN_PRODUCTS --region $REGION --code "$code" --runtime name=APPSYNC_JS,runtimeVersion=1.0.0

echo "Resolver update complete"