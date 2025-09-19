#!/bin/bash

echo "=== AppSync KMS Configuration Comparison ==="
echo

# API IDs
WORKING_API="rxlu3umb3bdhjgswtlwqbsd44m"
PROBLEM_API="abc4k4lp35bidexf7g4cwaacqm"

echo "1. Comparing AppSync Data Sources:"
echo "=================================="

echo "Working API (hazel_mapping_dev):"
aws appsync get-data-source --api-id $WORKING_API --name hazel_mapping_dev --query 'dataSource.{Name:name,ServiceRoleArn:serviceRoleArn,RelationalDatabaseConfig:relationalDatabaseConfig}' --output table

echo
echo "Problematic API (hazel_mapping_test):"
aws appsync get-data-source --api-id $PROBLEM_API --name hazel_mapping_test --query 'dataSource.{Name:name,ServiceRoleArn:serviceRoleArn,RelationalDatabaseConfig:relationalDatabaseConfig}' --output table

echo
echo "2. RDS Secrets and KMS Keys:"
echo "============================"

echo "All RDS secrets:"
aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `rds`)].{Name:Name,ARN:ARN,KmsKeyId:KmsKeyId}' --output table

echo
echo "3. Getting Secret Details:"
echo "=========================="

# Get all RDS secret ARNs
SECRET_ARNS=$(aws secretsmanager list-secrets --query 'SecretList[?contains(Name, `rds`)].ARN' --output text)

for SECRET_ARN in $SECRET_ARNS; do
    echo "Secret: $SECRET_ARN"
    aws secretsmanager describe-secret --secret-id "$SECRET_ARN" --query '{Name:Name,KmsKeyId:KmsKeyId,Description:Description}' --output table
    echo
done

echo "4. Service Role Policies:"
echo "========================"

# Extract service role names from data sources
DEV_ROLE=$(aws appsync get-data-source --api-id $WORKING_API --name hazel_mapping_dev --query 'dataSource.serviceRoleArn' --output text | cut -d'/' -f2)
TEST_ROLE=$(aws appsync get-data-source --api-id $PROBLEM_API --name hazel_mapping_test --query 'dataSource.serviceRoleArn' --output text | cut -d'/' -f2)

echo "Dev Role: $DEV_ROLE"
echo "Attached policies:"
aws iam list-attached-role-policies --role-name "$DEV_ROLE" --output table

echo
echo "Test Role: $TEST_ROLE"
echo "Attached policies:"
aws iam list-attached-role-policies --role-name "$TEST_ROLE" --output table

echo
echo "=== Comparison Complete ==="