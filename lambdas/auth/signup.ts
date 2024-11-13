import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};

  try {
    const { username, password, email } = body;

    const command = new SignUpCommand({
      ClientId: process.env.CLIENT_ID!,
      Username: username,
      Password: password,
      UserAttributes: [{ Name: "email", Value: email }],
    });

    const response = await client.send(command);
    return {
      statusCode: 200,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error during sign-up" }),
    };
  }
};
