import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";

export class PaintingsGalleryApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Table for paintings
    const paintingsTable = new dynamodb.Table(this, "PaintingsTable", {
      partitionKey: { name: "paintingId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Paintings",
    });

    // Output the table name
    new cdk.CfnOutput(this, "PaintingsTableName", {
      value: paintingsTable.tableName,
    });

    // Create REST API
    const api = new apig.RestApi(this, "PaintingsGalleryApi", {
      restApiName: "Paintings Gallery API",
      description: "API for managing paintings in a gallery.",
      deployOptions: { stageName: "dev" },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "PATCH", "DELETE"],
        allowOrigins: ["*"],
      },
    });

    // Lambda function for adding a painting
    const addPaintingFn = new lambdanode.NodejsFunction(this, "AddPaintingFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../lambdas/addPainting.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      bundling: {
        externalModules: ["aws-sdk"],
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    // Lambda function for getting all paintings
    const getPaintingsFn = new lambdanode.NodejsFunction(this, "GetPaintingsFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../lambdas/getPaintings.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      bundling: {
        externalModules: ["aws-sdk"],
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    // Lambda function for getting a painting by ID
    const getPaintingByIdFn = new lambdanode.NodejsFunction(this, "GetPaintingByIdFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../lambdas/getPaintingById.ts"),
      handler: "handler",
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      bundling: {
        externalModules: ["aws-sdk"],
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    });

    // Grant permission for the Lambda functions to access DynamoDB
    paintingsTable.grantReadWriteData(addPaintingFn);
    paintingsTable.grantReadData(getPaintingsFn);
    paintingsTable.grantReadData(getPaintingByIdFn);

    // Define /paintings POST endpoint
    const paintings = api.root.addResource("paintings");
    paintings.addMethod("POST", new apig.LambdaIntegration(addPaintingFn));
    paintings.addMethod("GET", new apig.LambdaIntegration(getPaintingsFn));

    // Define /paintings/{paintingId} GET endpoint
    const paintingEndpoint = paintings.addResource("{paintingId}");
    paintingEndpoint.addMethod("GET", new apig.LambdaIntegration(getPaintingByIdFn));
  }
}
