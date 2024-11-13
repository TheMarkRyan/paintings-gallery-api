import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as custom from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as path from "path";
import { paintings } from "../seed/paintings";

export class PaintingsGalleryApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB tables
    const paintingsTable = new dynamodb.Table(this, "PaintingsTable", {
      partitionKey: { name: "paintingId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Paintings",
    });

    // Cognito User Pool for Authentication
    const userPool = new cognito.UserPool(this, "UserPool", {
      signInAliases: { username: true, email: true },
      selfSignUpEnabled: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoVerify: { email: true },
    });

    const appClient = userPool.addClient("AppClient", {
      authFlows: { userPassword: true },
    });

    new cdk.CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new cdk.CfnOutput(this, "UserPoolClientId", { value: appClient.userPoolClientId });

    // API Gateway configuration
    const api = new apig.RestApi(this, "PaintingsGalleryApi", {
      restApiName: "Paintings Gallery API",
      description: "API for managing paintings and artists in a gallery.",
      deployOptions: { stageName: "dev" },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "DELETE"],
        allowOrigins: ["*"],
      },
    });

    // Lambda function configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      bundling: { externalModules: ["aws-sdk"] },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    };

    // Authentication Endpoints
    const authResource = api.root.addResource("auth");

    // Sign-up Lambda function
    const signUpFn = new lambdanode.NodejsFunction(this, "SignUpFn", {
      entry: path.join(__dirname, "../lambdas/auth/signup.ts"),
      environment: {
        CLIENT_ID: appClient.userPoolClientId,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    authResource.addResource("signup").addMethod("POST", new apig.LambdaIntegration(signUpFn));

    // Confirm sign-up Lambda function
    const confirmSignUpFn = new lambdanode.NodejsFunction(this, "ConfirmSignUpFn", {
      entry: path.join(__dirname, "../lambdas/auth/confirm-signup.ts"),
      environment: {
        CLIENT_ID: appClient.userPoolClientId,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    authResource.addResource("confirm_signup").addMethod("POST", new apig.LambdaIntegration(confirmSignUpFn));

    // Sign-in Lambda function
    const signInFn = new lambdanode.NodejsFunction(this, "SignInFn", {
      entry: path.join(__dirname, "../lambdas/auth/signin.ts"),
      environment: {
        CLIENT_ID: appClient.userPoolClientId,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    authResource.addResource("signin").addMethod("POST", new apig.LambdaIntegration(signInFn));

    // Sign-out Lambda function
    const signOutFn = new lambdanode.NodejsFunction(this, "SignOutFn", {
      entry: path.join(__dirname, "../lambdas/auth/signout.ts"),
      environment: {
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    authResource.addResource("signout").addMethod("POST", new apig.LambdaIntegration(signOutFn));

    // Paintings Endpoints

    // Function to get all paintings
    const getPaintingsFn = new lambdanode.NodejsFunction(this, "GetPaintingsFn", {
      entry: path.join(__dirname, "../lambdas/getPaintings.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    paintingsTable.grantReadData(getPaintingsFn);

    // Function to get a painting by ID
    const getPaintingByIdFn = new lambdanode.NodejsFunction(this, "GetPaintingByIdFn", {
      entry: path.join(__dirname, "../lambdas/getPaintingById.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    paintingsTable.grantReadData(getPaintingByIdFn);

    // Define /paintings route
    const paintingsResource = api.root.addResource("paintings");
    paintingsResource.addMethod("GET", new apig.LambdaIntegration(getPaintingsFn));

    // Define /paintings/{paintingId} route
    const paintingByIdResource = paintingsResource.addResource("{paintingId}");
    paintingByIdResource.addMethod("GET", new apig.LambdaIntegration(getPaintingByIdFn));

    // Seed initial data (optional)
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
                },
              },
            })),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("LoadInitialPaintingsData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({ resources: [paintingsTable.tableArn] }),
    });
  }
}
