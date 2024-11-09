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

    // Lambda function for getting paintings by artist
    const getPaintingsByArtistFn = new lambdanode.NodejsFunction(this, "GetPaintingsByArtistFn", {
      runtime: lambda.Runtime.NODEJS_16_X,
      entry: path.join(__dirname, "../lambdas/getPaintingsByArtist.ts"),
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

    // Grant permissions to Lambda functions
    paintingsTable.grantReadWriteData(addPaintingFn);
    paintingsTable.grantReadData(getPaintingsFn);
    paintingsTable.grantReadData(getPaintingByIdFn);
    paintingsTable.grantReadData(getPaintingsByArtistFn);

    // Define /paintings POST and GET endpoints
    const paintingsResource = api.root.addResource("paintings");
    paintingsResource.addMethod("POST", new apig.LambdaIntegration(addPaintingFn));
    paintingsResource.addMethod("GET", new apig.LambdaIntegration(getPaintingsFn));

    // Define the endpoint for getting a painting by ID
    const paintingByIdResource = paintingsResource.addResource("{paintingId}");
    paintingByIdResource.addMethod("GET", new apig.LambdaIntegration(getPaintingByIdFn));

    // Define the endpoint for getting paintings by artist
    const paintingsByArtistResource = api.root.addResource("paintingsByArtist");
    paintingsByArtistResource.addMethod("GET", new apig.LambdaIntegration(getPaintingsByArtistFn));

    // Output for API endpoints
    new cdk.CfnOutput(this, "AddPaintingApi", {
      value: `${api.url}paintings`,
      description: "API endpoint for adding a painting (POST)",
    });

    new cdk.CfnOutput(this, "GetPaintingsApi", {
      value: `${api.url}paintings`,
      description: "API endpoint for getting all paintings (GET)",
    });

    new cdk.CfnOutput(this, "GetPaintingByIdApi", {
      value: `${api.url}paintings/{paintingId}`,
      description: "API endpoint for getting a painting by ID (GET)",
    });

    new cdk.CfnOutput(this, "GetPaintingsByArtistApi", {
      value: `${api.url}paintingsByArtist?artist=`,
      description: "API endpoint for getting paintings by artist (GET)",
    });
  }
}
