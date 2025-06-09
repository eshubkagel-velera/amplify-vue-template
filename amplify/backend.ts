import { defineBackend } from '@aws-amplify/backend';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

const backend = defineBackend({});

const bucketStack = backend.createStack('CloudAssetsStack');
const existingBucket = s3.Bucket.fromBucketName(bucketStack, 'HazelAmplifyBucket', 'hazel-amplify');

const distribution = new cloudfront.Distribution(bucketStack, 'HazelAmplifyDistribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(existingBucket), // Deprecated, but required for now
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
  defaultRootObject: 'index.html',
});

backend.addOutput({
    custom: {
      cloudfront_url: `https://${distribution.distributionDomainName}`
    }
});