import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

const paintingsTable = new dynamodb.Table(this, 'PaintingsTable', {
  partitionKey: { name: 'paintingId', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'reviewId', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
});
