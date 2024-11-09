import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as path from "path";
import { paintings } from "../seed/paintings";

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

    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      bundling: {
        externalModules: ["aws-sdk"],
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    };

    // Lambda function for adding a painting
    const addPaintingFn = new lambdanode.NodejsFunction(this, "AddPaintingFn", {
      entry: path.join(__dirname, "../lambdas/addPainting.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig
    });

    // Lambda function for getting all paintings
    const getPaintingsFn = new lambdanode.NodejsFunction(this, "GetPaintingsFn", {
      entry: path.join(__dirname, "../lambdas/getPaintings.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig
    });

    // Lambda function for getting a painting by ID
    const getPaintingByIdFn = new lambdanode.NodejsFunction(this, "GetPaintingByIdFn", {
      entry: path.join(__dirname, "../lambdas/getPaintingById.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig
    });

    // Lambda function for deleting a painting
    const deletePaintingFn = new lambdanode.NodejsFunction(this, "DeletePaintingFn", {
      entry: path.join(__dirname, "../lambdas/deletePainting.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig
    });

    // Permissions
    paintingsTable.grantReadWriteData(addPaintingFn);
    paintingsTable.grantReadWriteData(deletePaintingFn);
    paintingsTable.grantReadData(getPaintingsFn);
    paintingsTable.grantReadData(getPaintingByIdFn);

    // API Endpoints
    const paintingsResource = api.root.addResource("paintings");
    paintingsResource.addMethod("POST", new apig.LambdaIntegration(addPaintingFn));
    paintingsResource.addMethod("GET", new apig.LambdaIntegration(getPaintingsFn));

    const paintingByIdResource = paintingsResource.addResource("{paintingId}");
    paintingByIdResource.addMethod("GET", new apig.LambdaIntegration(getPaintingByIdFn));
    paintingByIdResource.addMethod("DELETE", new apig.LambdaIntegration(deletePaintingFn));

    // Outputs for API endpoints
    new cdk.CfnOutput(this, "AddPaintingApi", {
      value: `${api.url}paintings`,
      description: "API endpoint for adding a painting (POST)"
    });
    new cdk.CfnOutput(this, "GetPaintingsApi", {
      value: `${api.url}paintings`,
      description: "API endpoint for getting all paintings (GET)"
    });
    new cdk.CfnOutput(this, "GetPaintingByIdApi", {
      value: `${api.url}paintings/{paintingId}`,
      description: "API endpoint for getting a painting by ID (GET)"
    });
    new cdk.CfnOutput(this, "DeletePaintingApi", {
      value: `${api.url}paintings/{paintingId}`,
      description: "API endpoint for deleting a painting (DELETE)"
    });

    // Custom resource to load initial data into DynamoDB
    new custom.AwsCustomResource(this, "LoadInitialPaintingsData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [paintingsTable.tableName]: paintings.map((painting) => ({
              PutRequest: {
                Item: {
                  paintingId: { S: painting.paintingId },
                  title: { S: painting.title },
                  artist: { S: painting.artist },
                  year: { S: painting.year },
                  description: { S: painting.description },
                  medium: { S: painting.medium },
                  place: { S: painting.place },
                  period: { S: painting.period },
                  currentStatus: { S: painting.currentStatus },
                }
              }
            }))
          }
        },
        physicalResourceId: custom.PhysicalResourceId.of("LoadInitialPaintingsData")
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({ resources: [paintingsTable.tableArn] }),
    });
  }
}
