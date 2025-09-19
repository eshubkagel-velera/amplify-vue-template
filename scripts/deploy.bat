@echo off
if "%1"=="" (
    echo Usage: deploy.bat [dev^|test^|uat^|prod]
    exit /b 1
)

set ENV=%1
echo Deploying to %ENV% environment...

cd environments\%ENV%
if not exist package.json (
    echo Installing dependencies...
    npm install
)

echo Running deployment...
npx ampx pipeline-deploy --branch %ENV%

cd ..\..
echo Deployment to %ENV% completed!