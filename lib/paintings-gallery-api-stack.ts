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
import { artists } from "../seed/artists";


export class PaintingsGalleryApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB Tables
    const paintingsTable = new dynamodb.Table(this, "PaintingsTable", {
      partitionKey: { name: "paintingId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Paintings",
    });

    const artistsTable = new dynamodb.Table(this, "ArtistsTable", {
      partitionKey: { name: "artistId", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Artists",
    });

    // Cognito User Pool
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

    // API Gateway
    const api = new apig.RestApi(this, "PaintingsGalleryApi", {
      restApiName: "Paintings Gallery API",
      description: "API for managing paintings and artists in a gallery.",
      deployOptions: { stageName: "dev" },
      defaultCorsPreflightOptions: {
        allowHeaders: ["Content-Type", "X-Amz-Date"],
        allowMethods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
        allowOrigins: ["*"],
      },
    });

    // Lambda Function Configuration
    const lambdaConfig = {
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      bundling: { externalModules: ["aws-sdk"] },
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
    };

    // Authentication Endpoints
    const authResource = api.root.addResource("auth");

    const signUpFn = new lambdanode.NodejsFunction(this, "SignUpFn", {
      entry: path.join(__dirname, "../lambdas/auth/signup.ts"),
      environment: {
        CLIENT_ID: appClient.userPoolClientId,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    authResource.addResource("signup").addMethod("POST", new apig.LambdaIntegration(signUpFn));

    const confirmSignUpFn = new lambdanode.NodejsFunction(this, "ConfirmSignUpFn", {
      entry: path.join(__dirname, "../lambdas/auth/confirm-signup.ts"),
      environment: {
        CLIENT_ID: appClient.userPoolClientId,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    authResource.addResource("confirm_signup").addMethod("POST", new apig.LambdaIntegration(confirmSignUpFn));

    const signInFn = new lambdanode.NodejsFunction(this, "SignInFn", {
      entry: path.join(__dirname, "../lambdas/auth/signin.ts"),
      environment: {
        CLIENT_ID: appClient.userPoolClientId,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    authResource.addResource("signin").addMethod("POST", new apig.LambdaIntegration(signInFn));

    // CRUD Endpoints for Paintings

    // Get All Paintings
    const getPaintingsFn = new lambdanode.NodejsFunction(this, "GetPaintingsFn", {
      entry: path.join(__dirname, "../lambdas/getPaintings.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    paintingsTable.grantReadData(getPaintingsFn);
    const paintingsResource = api.root.addResource("paintings");
    paintingsResource.addMethod("GET", new apig.LambdaIntegration(getPaintingsFn));

    // Get Painting by ID
    const getPaintingByIdFn = new lambdanode.NodejsFunction(this, "GetPaintingByIdFn", {
      entry: path.join(__dirname, "../lambdas/getPaintingById.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    paintingsTable.grantReadData(getPaintingByIdFn);
    const paintingByIdResource = paintingsResource.addResource("{paintingId}");
    paintingByIdResource.addMethod("GET", new apig.LambdaIntegration(getPaintingByIdFn));

    // Add New Painting
    const addPaintingFn = new lambdanode.NodejsFunction(this, "AddPaintingFn", {
      entry: path.join(__dirname, "../lambdas/addPainting.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    paintingsTable.grantWriteData(addPaintingFn);
    paintingsResource.addMethod("POST", new apig.LambdaIntegration(addPaintingFn));

    // Update Painting
    const updatePaintingFn = new lambdanode.NodejsFunction(this, "UpdatePaintingFn", {
      entry: path.join(__dirname, "../lambdas/updatePainting.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    paintingsTable.grantWriteData(updatePaintingFn);
    paintingByIdResource.addMethod("PUT", new apig.LambdaIntegration(updatePaintingFn));

    // Delete Painting
    const deletePaintingFn = new lambdanode.NodejsFunction(this, "DeletePaintingFn", {
      entry: path.join(__dirname, "../lambdas/deletePainting.ts"),
      environment: {
        TABLE_NAME: paintingsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    paintingsTable.grantWriteData(deletePaintingFn);
    paintingByIdResource.addMethod("DELETE", new apig.LambdaIntegration(deletePaintingFn));

    // Artists Endpoints
    const getArtistsFn = new lambdanode.NodejsFunction(this, "GetArtistsFn", {
      entry: path.join(__dirname, "../lambdas/getArtists.ts"),
      environment: {
        TABLE_NAME: artistsTable.tableName,
        REGION: "eu-west-1",
      },
      ...lambdaConfig,
    });
    artistsTable.grantReadData(getArtistsFn);
    const artistsResource = api.root.addResource("artists");
    artistsResource.addMethod("GET", new apig.LambdaIntegration(getArtistsFn));

    // Seed Initial Data for Paintings
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
    new custom.AwsCustomResource(this, "LoadInitialArtistsData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [artistsTable.tableName]: artists.map((artist) => ({
              PutRequest: {
                Item: {
                  artistId: { S: artist.artistId },
                  name: { S: artist.name },
                  birthYear: { S: artist.birthYear },
                  deathYear: { S: artist.deathYear },
                  nationality: { S: artist.nationality },
                  biography: { S: artist.biography },
                },
              },
            })),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("LoadInitialArtistsData"),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({ resources: [artistsTable.tableArn] }),
    });
    
  }
  
}
