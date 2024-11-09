import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const artist = event.queryStringParameters?.artist;

    if (!artist) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Artist name is required." }),
      };
    }

    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
    });

    const response = await ddbDocClient.send(command);
    
    // Filter paintings by artist name (includes case-insensitive partial matching. I added this as some artists are known by their surnames. E.g Vincent Van Gogh is colloquially known as "Van Gogh")
    const paintings = response.Items?.filter(item => 
      item.artist?.toLowerCase().includes(artist.toLowerCase())
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paintings),
    };
  } catch (error) {
    console.error("Error fetching paintings by artist:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Could not fetch paintings" }),
    };
  }
};
