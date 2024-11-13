import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient } from "../shared/ddbDocClient";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async () => {
  try {
    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
    });

    const response = await ddbDocClient.send(command);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: response.Items }),
    };
  } catch (error: any) {
    console.error("Error fetching artists:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
