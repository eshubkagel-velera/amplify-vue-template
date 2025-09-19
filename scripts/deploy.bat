@echo off
if "%1"=="" (
    echo Usage: deploy.bat [dev^|test^|uat^|prod] [resolvers]
    echo   deploy.bat test          - Full pipeline deploy
    echo   deploy.bat test resolvers - Upload resolvers only
    exit /b 1
)

set ENV=%1
set MODE=%2

if "%MODE%"=="resolvers" (
    echo Uploading resolvers to %ENV% environment...
    call scripts\upload-resolvers.bat %ENV%
    exit /b 0
)

echo Deploying to %ENV% environment...

cd environments\%ENV%
if not exist package.json (
    echo Installing dependencies...
    npm install
)

echo Running deployment...
npx ampx pipeline-deploy --branch %ENV% --app-id d2s8vhkqhqvhqy

cd ..\..
echo Deployment to %ENV% completed!