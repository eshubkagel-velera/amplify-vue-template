#!/bin/bash

set -e

REGION="us-east-2"
TARGET_CLUSTER="hazel-mapping-uat"
SOURCE_DB="hazel_mapping_test"
TARGET_DB="hazel_mapping_uat"

echo "Getting cluster endpoint and credentials..."
ENDPOINT=$(aws rds describe-db-clusters \
  --db-cluster-identifier $TARGET_CLUSTER \
  --region $REGION \
  --query 'DBClusters[0].Endpoint' \
  --output text)

SECRET_ARN=$(aws rds describe-db-clusters \
  --db-cluster-identifier $TARGET_CLUSTER \
  --region $REGION \
  --query 'DBClusters[0].MasterUserSecret.SecretArn' \
  --output text)

echo "Getting database credentials from Secrets Manager..."
CREDENTIALS=$(aws secretsmanager get-secret-value \
  --secret-id $SECRET_ARN \
  --region $REGION \
  --query 'SecretString' \
  --output text)

USERNAME=$(echo $CREDENTIALS | jq -r '.username')
PASSWORD=$(echo $CREDENTIALS | jq -r '.password')

echo "Connecting to database at $ENDPOINT..."

# Create new database
echo "Creating database $TARGET_DB..."
mysql -h $ENDPOINT -u $USERNAME -p$PASSWORD -e "CREATE DATABASE IF NOT EXISTS $TARGET_DB;"

# Get list of tables
echo "Getting table list from $SOURCE_DB..."
TABLES=$(mysql -h $ENDPOINT -u $USERNAME -p$PASSWORD -e "SHOW TABLES FROM $SOURCE_DB;" -s -N)

# Copy each table
for table in $TABLES; do
  echo "Copying table: $table"
  mysql -h $ENDPOINT -u $USERNAME -p$PASSWORD -e "CREATE TABLE $TARGET_DB.$table AS SELECT * FROM $SOURCE_DB.$table;"
done

# Drop original database
echo "Dropping original database $SOURCE_DB..."
mysql -h $ENDPOINT -u $USERNAME -p$PASSWORD -e "DROP DATABASE $SOURCE_DB;"

echo "Database rename completed successfully!"
echo "New database: $TARGET_DB"