#!/bin/bash

set -e
set -o pipefail

REGION="us-east-2"
SOURCE_CLUSTER="hazel-mapping-test"
TARGET_CLUSTER="hazel-mapping-uat"
SOURCE_DB="hazel_mapping_test"
TARGET_DB="hazel_mapping_uat"
SNAPSHOT_ID="uat-clone-20250924-140233"

echo "Using existing snapshot: $SNAPSHOT_ID"

# Check if cluster already exists
if aws rds describe-db-clusters --db-cluster-identifier $TARGET_CLUSTER --region $REGION >/dev/null 2>&1; then
  echo "Cluster $TARGET_CLUSTER already exists, skipping creation..."
  SKIP_CREATION=true
else
  echo "Cluster $TARGET_CLUSTER does not exist, will create..."
  SKIP_CREATION=false
fi

if [ "$SKIP_CREATION" = false ]; then
  echo "Getting VPC configuration from source cluster..."
  # Get the actual subnet group from source cluster instances
  SUBNET_GROUP=$(aws rds describe-db-instances \
    --db-instance-identifier hazel-mapping-test-instance-1 \
    --region $REGION \
    --query 'DBInstances[0].DBSubnetGroup.DBSubnetGroupName' \
    --output text)

  SECURITY_GROUP=$(aws rds describe-db-clusters \
    --db-cluster-identifier $SOURCE_CLUSTER \
    --region $REGION \
    --query 'DBClusters[0].VpcSecurityGroups[0].VpcSecurityGroupId' \
    --output text)

  echo "Using subnet group: $SUBNET_GROUP"
  echo "Using security group: $SECURITY_GROUP"

  echo "Restoring snapshot to $TARGET_CLUSTER..."
  aws rds restore-db-cluster-from-snapshot \
    --db-cluster-identifier $TARGET_CLUSTER \
    --snapshot-identifier $SNAPSHOT_ID \
    --engine aurora-mysql \
    --db-subnet-group-name $SUBNET_GROUP \
    --vpc-security-group-ids $SECURITY_GROUP \
    --enable-http-endpoint \
    --region $REGION \
    --no-cli-pager

  echo "Creating instance in $TARGET_CLUSTER..."
  aws rds create-db-instance \
    --db-instance-identifier ${TARGET_CLUSTER}-instance \
    --db-instance-class db.t3.medium \
    --engine aurora-mysql \
    --db-cluster-identifier $TARGET_CLUSTER \
    --region $REGION \
    --no-cli-pager
else
  echo "Enabling HTTP endpoint for existing cluster..."
  aws rds modify-db-cluster \
    --db-cluster-identifier $TARGET_CLUSTER \
    --enable-http-endpoint \
    --region $REGION \
    --no-cli-pager
fi

echo "Waiting for cluster to be available..."
aws rds wait db-cluster-available \
  --db-cluster-identifier $TARGET_CLUSTER \
  --region $REGION

echo "Enabling HTTP endpoint for RDS Data API..."
aws rds modify-db-cluster \
  --db-cluster-identifier $TARGET_CLUSTER \
  --enable-http-endpoint \
  --region $REGION \
  --no-cli-pager

echo "Waiting for cluster modification to complete..."
aws rds wait db-cluster-available \
  --db-cluster-identifier $TARGET_CLUSTER \
  --region $REGION

echo "Getting new cluster endpoint..."
ENDPOINT=$(aws rds describe-db-clusters \
  --db-cluster-identifier $TARGET_CLUSTER \
  --region $REGION \
  --query 'DBClusters[0].Endpoint' \
  --output text)

echo "New cluster endpoint: $ENDPOINT"

echo "Database operations completed - cluster restored with $SOURCE_DB database."
echo "Manual steps required:"
echo "1. Connect to: $ENDPOINT"
echo "2. CREATE DATABASE $TARGET_DB;"
echo "3. Copy tables from $SOURCE_DB to $TARGET_DB"
echo "4. DROP DATABASE $SOURCE_DB;"

echo "Keeping snapshot $SNAPSHOT_ID for future use..."

echo "UAT cluster created successfully!"
echo "Cluster: $TARGET_CLUSTER"
echo "Database: $TARGET_DB"
echo "Endpoint: $ENDPOINT"