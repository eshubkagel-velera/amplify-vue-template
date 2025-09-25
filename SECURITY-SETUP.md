# Security Setup Instructions

## Required SES Configuration

**1. Verify SES Domain:**
```bash
aws ses verify-domain-identity --domain velera.com --region us-east-2
```

**2. Verify SES Email:**
```bash
aws ses verify-email-identity --email-address admin@velera.com --region us-east-2
```

**3. Check Verification Status:**
```bash
aws ses get-identity-verification-attributes --identities velera.com admin@velera.com --region us-east-2
```

## Security Improvements Made

1. **Input Validation**: Email format validation in both Lambda functions
2. **Scoped IAM Permissions**: Limited to specific User Pool and SES identities
3. **Error Sanitization**: Sensitive data removed from logs
4. **Dynamic Region**: Uses AWS_REGION environment variable
5. **Email Validation**: Proper regex validation for email format

## Manual Steps After Deployment

1. **Add Admin Users**: Manually add users to Admin group in Cognito Console
2. **Test Email Sending**: Verify SES can send emails from admin@velera.com
3. **Monitor CloudWatch**: Check Lambda logs for errors
4. **Set Up Alarms**: Create CloudWatch alarms for Lambda failures

## Production Recommendations

- Move to SES production mode (remove sandbox)
- Add rate limiting with API Gateway
- Enable CloudTrail for audit logging
- Use AWS WAF for additional protection
- Implement backup notification methods