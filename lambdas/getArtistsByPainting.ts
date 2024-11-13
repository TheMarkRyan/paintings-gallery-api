import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { QueryCommand, BatchGetCommand } from "@aws-sdk/lib-dynamodb";
import { createDDbDocClient } from "../shared/ddbDocClient";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const paintingId = event.pathParameters?.paintingId;

    if (!paintingId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Painting ID is required." }),
      };
    }

    const command = new QueryCommand({
      TableName: process.env.LINK_TABLE_NAME as string,
      KeyConditionExpression: "paintingId = :paintingId",
      ExpressionAttributeValues: { ":paintingId": paintingId },
    });

    const response = await ddbDocClient.send(command);
    const artistIds = response.Items?.map((item) => ({ artistId: item.artistId }));

    if (!artistIds || artistIds.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "No artists found for this painting." }),
      };
    }

    const batchGetCommand = new BatchGetCommand({
      RequestItems: {
        [process.env.ARTISTS_TABLE_NAME as string]: { Keys: artistIds },
      },
    });

    const batchResponse = await ddbDocClient.send(batchGetCommand);
    const artistDetails = batchResponse.Responses?.[process.env.ARTISTS_TABLE_NAME as string] || [];

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(artistDetails),
    };
  } catch (error: any) {
    console.error("Error fetching artists by painting:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
