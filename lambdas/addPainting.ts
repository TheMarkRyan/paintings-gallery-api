
import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // Parse the request body
    const data = JSON.parse(event.body || "{}");

    // Define the item to be added
    const params = {
      TableName: process.env.TABLE_NAME,
      Item: {
        paintingId: data.paintingId,
        title: data.title,
        artist: data.artist,
        year: data.year,
        description: data.description,
      },
    };

    // Add the item to DynamoDB
    await ddbDocClient.send(new PutCommand(params));

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: "Painting added successfully!" }),
    };
  } catch (error) {
    console.error("Error adding painting:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Could not add painting" }),
    };
  }
};