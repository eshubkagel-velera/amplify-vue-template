@echo off
set API_ID=fi5pjed64nf4ran34tusrlvi7u
set REGION=us-east-2

echo Updating key resolvers...

echo Updating listLOAN_APPS resolver...
powershell -Command "$json = Get-Content 'resolvers/Query_listLOAN_APPS.json' | ConvertFrom-Json; aws appsync update-resolver --api-id %API_ID% --type-name Query --field-name listLOAN_APPS --region %REGION% --code \"$($json.resolver.code)\" --runtime name=APPSYNC_JS,runtimeVersion=1.0.0"

echo Updating listORIGIN_PRODUCTS resolver...
powershell -Command "$json = Get-Content 'resolvers/Query_listORIGIN_PRODUCTS.json' | ConvertFrom-Json; aws appsync update-resolver --api-id %API_ID% --type-name Query --field-name listORIGIN_PRODUCTS --region %REGION% --code \"$($json.resolver.code)\" --runtime name=APPSYNC_JS,runtimeVersion=1.0.0"

echo Resolver update complete