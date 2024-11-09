import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const paintingId = event.pathParameters?.paintingId;
  
  if (!paintingId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Painting ID is required.' }),
    };
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: process.env.TABLE_NAME,
      Key: { paintingId },
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Painting deleted successfully.' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to delete the painting.' }),
    };
  }
};
