@echo off
echo Checking REDIRECT_URL table structure...
aws rds-data execute-statement --resource-arn "arn:aws:rds:us-east-2:794611117044:cluster:hazel-mapping" --secret-arn "arn:aws:secretsmanager:us-east-2:794611117044:secret:rds!cluster-a11d98c5-d647-45a2-9978-f81be7aa3d60-iDsvX3" --database "hazel_mapping_dev" --sql "DESCRIBE REDIRECT_URL" > redirect_url_structure.json

echo Checking REDIRECT_URL record count...
aws rds-data execute-statement --resource-arn "arn:aws:rds:us-east-2:794611117044:cluster:hazel-mapping" --secret-arn "arn:aws:secretsmanager:us-east-2:794611117044:secret:rds!cluster-a11d98c5-d647-45a2-9978-f81be7aa3d60-iDsvX3" --database "hazel_mapping_dev" --sql "SELECT COUNT(*) FROM REDIRECT_URL" > redirect_url_count.json

echo Checking REDIRECT_URL sample data...
aws rds-data execute-statement --resource-arn "arn:aws:rds:us-east-2:794611117044:cluster:hazel-mapping" --secret-arn "arn:aws:secretsmanager:us-east-2:794611117044:secret:rds!cluster-a11d98c5-d647-45a2-9978-f81be7aa3d60-iDsvX3" --database "hazel_mapping_dev" --sql "SELECT * FROM REDIRECT_URL LIMIT 5" > redirect_url_sample.json

echo Testing INSERT with generated ID...
aws rds-data execute-statement --resource-arn "arn:aws:rds:us-east-2:794611117044:cluster:hazel-mapping" --secret-arn "arn:aws:secretsmanager:us-east-2:794611117044:secret:rds!cluster-a11d98c5-d647-45a2-9978-f81be7aa3d60-iDsvX3" --database "hazel_mapping_dev" --sql "INSERT INTO REDIRECT_URL (ORIGIN_PRODUCT_ID, URL_TYPE_CODE, URL, RESPONSE_TEXT, CREATED_BY_USER_ID, CREATED_DATE) VALUES (1, 'T', 'test.com', 'test', 999, '2024-01-01')" > insert_test.json

echo Done. Check redirect_url_structure.json, redirect_url_count.json, redirect_url_sample.json, and insert_test.json