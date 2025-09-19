@echo off
setlocal enabledelayedexpansion
if "%1"=="" (
    echo Usage: upload-resolvers.bat [dev^|test^|uat^|prod] [resolver-name]
    echo   upload-resolvers.bat test                    - Upload all resolvers
    echo   upload-resolvers.bat test createSERVICE     - Upload specific resolver
    exit /b 1
)

set ENV=%1
set SPECIFIC_RESOLVER=%2

if "%SPECIFIC_RESOLVER%"=="" (
    echo Uploading all resolvers to %ENV% environment...
) else (
    echo Uploading %SPECIFIC_RESOLVER% resolver to %ENV% environment...
)

rem Set API IDs and data sources for each environment
if "%ENV%"=="dev" (
    set API_ID=rxlu3umb3bdhjgswtlwqbsd44m
    set DATA_SOURCE=hazel_mapping_dev
) else if "%ENV%"=="test" (
    set API_ID=abc4k4lp35bidexf7g4cwaacqm
    set DATA_SOURCE=hazel_mapping_test
) else (
    echo Invalid environment: %ENV%
    exit /b 1
)

set REGION=us-east-2

rem Use shared resolvers since they handle environment detection
cd shared\resolvers

if "%SPECIFIC_RESOLVER%"=="" (
    echo Uploading all resolvers...
    
    rem Upload all Mutation resolvers
    for %%f in (Mutation_*.js) do (
        set FILENAME=%%f
        set FIELD_NAME=!FILENAME:~9,-3!
        echo Uploading !FIELD_NAME!...
        aws appsync update-resolver --region %REGION% --api-id %API_ID% --type-name Mutation --field-name !FIELD_NAME! --data-source-name %DATA_SOURCE% --request-mapping-template file://%%f --response-mapping-template file://%%f >nul 2>&1
    )
    
    rem Upload all Query resolvers
    for %%f in (Query_*.js) do (
        set FILENAME=%%f
        set FIELD_NAME=!FILENAME:~6,-3!
        echo Uploading !FIELD_NAME!...
        aws appsync update-resolver --region %REGION% --api-id %API_ID% --type-name Query --field-name !FIELD_NAME! --data-source-name %DATA_SOURCE% --request-mapping-template file://%%f --response-mapping-template file://%%f >nul 2>&1
    )
) else (
    rem Upload specific resolver
    if exist "Mutation_%SPECIFIC_RESOLVER%.js" (
        echo Uploading Mutation_%SPECIFIC_RESOLVER%.js...
        aws appsync update-resolver --region %REGION% --api-id %API_ID% --type-name Mutation --field-name %SPECIFIC_RESOLVER% --data-source-name %DATA_SOURCE% --request-mapping-template file://Mutation_%SPECIFIC_RESOLVER%.js --response-mapping-template file://Mutation_%SPECIFIC_RESOLVER%.js >nul 2>&1
    ) else if exist "Query_%SPECIFIC_RESOLVER%.js" (
        echo Uploading Query_%SPECIFIC_RESOLVER%.js...
        aws appsync update-resolver --region %REGION% --api-id %API_ID% --type-name Query --field-name %SPECIFIC_RESOLVER% --data-source-name %DATA_SOURCE% --request-mapping-template file://Query_%SPECIFIC_RESOLVER%.js --response-mapping-template file://Query_%SPECIFIC_RESOLVER%.js >nul 2>&1
    ) else (
        echo Error: Resolver %SPECIFIC_RESOLVER% not found!
        exit /b 1
    )
)

cd ..\..
echo Resolver upload to %ENV% completed!