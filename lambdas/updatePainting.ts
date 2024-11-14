import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const paintingId = event.pathParameters?.paintingId;
    const body = JSON.parse(event.body || "{}");

    if (!paintingId || !body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing paintingId or body content" }),
      };
    }

    const command = new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { paintingId },
      UpdateExpression: "set #title = :title, #artist = :artist, #year = :year, #description = :description, #medium = :medium, #place = :place, #period = :period, #currentStatus = :currentStatus",
      ExpressionAttributeNames: {
        "#title": "title",
        "#artist": "artist",
        "#year": "year",
        "#description": "description",
        "#medium": "medium",
        "#place": "place",
        "#period": "period",
        "#currentStatus": "currentStatus",
      },
      ExpressionAttributeValues: {
        ":title": body.title,
        ":artist": body.artist,
        ":year": body.year,
        ":description": body.description,
        ":medium": body.medium,
        ":place": body.place,
        ":period": body.period,
        ":currentStatus": body.currentStatus,
      },
      ReturnValues: "ALL_NEW",
    });

    const response = await ddbDocClient.send(command);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updatedItem: response.Attributes }),
    };
  } catch (error) {
    console.error("Error updating painting:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Could not update painting" }),
    };
  }
};
