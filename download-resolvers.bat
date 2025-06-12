@echo off
set API_ID=rxlu3umb3bdhjgswtlwqbsd44m
set REGION=us-east-2

mkdir resolvers 2>nul

echo Downloading Query resolvers...
for /f "tokens=*" %%i in ('aws appsync list-resolvers --api-id %API_ID% --type-name Query --region %REGION% --query "resolvers[].fieldName" --output text') do (
    aws appsync get-resolver --api-id %API_ID% --type-name Query --field-name %%i --region %REGION% > resolvers\Query_%%i.json
    echo Downloaded Query_%%i.json
)

echo Downloading Mutation resolvers...
for /f "tokens=*" %%i in ('aws appsync list-resolvers --api-id %API_ID% --type-name Mutation --region %REGION% --query "resolvers[].fieldName" --output text') do (
    aws appsync get-resolver --api-id %API_ID% --type-name Mutation --field-name %%i --region %REGION% > resolvers\Mutation_%%i.json
    echo Downloaded Mutation_%%i.json
)

echo Downloading Subscription resolvers...
for /f "tokens=*" %%i in ('aws appsync list-resolvers --api-id %API_ID% --type-name Subscription --region %REGION% --query "resolvers[].fieldName" --output text') do (
    aws appsync get-resolver --api-id %API_ID% --type-name Subscription --field-name %%i --region %REGION% > resolvers\Subscription_%%i.json
    echo Downloaded Subscription_%%i.json
)

echo All resolvers downloaded to resolvers\ folder