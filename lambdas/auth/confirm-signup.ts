import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    const { username, confirmationCode } = body;

    const command = new ConfirmSignUpCommand({
      ClientId: process.env.CLIENT_ID!,
      Username: username,
      ConfirmationCode: confirmationCode,
    });
    

    await client.send(command);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `User ${username} successfully confirmed` }),
    };
  } catch (error) {
    console.error("Error during confirmation:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: "Error during confirmation", 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
    };
  }
};
