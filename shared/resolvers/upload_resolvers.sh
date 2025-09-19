#!/bin/bash

API_ID="$1"
SOURCE_FOLDER="$2"
DATA_SOURCE_NAME="$3"
LOG_FILE="upload_results_$(date +%Y%m%d_%H%M%S).log"

if [ -z "$API_ID" ] || [ -z "$SOURCE_FOLDER" ] || [ -z "$DATA_SOURCE_NAME" ]; then
  echo "Usage: $0 <API_ID> <SOURCE_FOLDER> <DATA_SOURCE_NAME>"
  exit 1
fi

if [ ! -d "$SOURCE_FOLDER" ]; then
  echo "Error: Source folder '$SOURCE_FOLDER' does not exist"
  exit 1
fi

echo "Upload started at $(date)" | tee "$LOG_FILE"
echo "API_ID: $API_ID" | tee -a "$LOG_FILE"
echo "SOURCE_FOLDER: $SOURCE_FOLDER" | tee -a "$LOG_FILE"
echo "DATA_SOURCE_NAME: $DATA_SOURCE_NAME" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

for file in "$SOURCE_FOLDER"/*.js; do
  if [ -f "$file" ]; then
    filename=$(basename "$file" .js | tr -d '\r')
    
    if [[ "$filename" == *"_"* ]]; then
      TYPE_NAME=$(echo "$filename" | cut -d'_' -f1 | tr -d '\r')
      FIELD_NAME=$(echo "$filename" | cut -d'_' -f2- | tr -d '\r')
      
      echo "Updating resolver: $TYPE_NAME.$FIELD_NAME" | tee -a "$LOG_FILE"
      
      aws appsync update-resolver \
        --api-id "$API_ID" \
        --type-name "$TYPE_NAME" \
        --field-name "$FIELD_NAME" \
        --data-source-name "$DATA_SOURCE_NAME" \
        --runtime name=APPSYNC_JS,runtimeVersion=1.0.0 \
        --code file://"$file" \
        --no-cli-pager 2>&1 | tee -a "$LOG_FILE"
        
      if [ $? -eq 0 ]; then
        echo "  ✓ Success" | tee -a "$LOG_FILE"
      else
        echo "  ✗ Failed" | tee -a "$LOG_FILE"
      fi
      echo "" | tee -a "$LOG_FILE"
    fi
  fi
done

echo "Upload complete at $(date)" | tee -a "$LOG_FILE"
echo "Results saved to: $LOG_FILE"