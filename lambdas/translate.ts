import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import * as AWS from "aws-sdk";

// Initialize DynamoDB and Translate clients
const ddbClient = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const translate = new AWS.Translate({ region: process.env.REGION });

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const language = event.queryStringParameters?.language;

  try {
    // Fetch all paintings from the database
    const command = new ScanCommand({
      TableName: process.env.TABLE_NAME,
    });
    const response = await ddbDocClient.send(command);
    const paintings = response.Items || [];

    // If no language is specified, return the paintings in English
    if (!language) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paintings }),
      };
    }

    // Translate each painting's title and description to the specified language
    const translatedPaintings = await Promise.all(
      paintings.map(async (painting) => {
        const translatedTitle = await translateText(painting.title, language);
        const translatedDescription = await translateText(painting.description, language);

        return {
          ...painting,
          title: translatedTitle,
          description: translatedDescription,
        };
      })
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paintings: translatedPaintings }),
    };
  } catch (error) {
    console.error("Error fetching or translating paintings:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Could not fetch or translate paintings" }),
    };
  }
};

// Helper function for translation with additional logging
const translateText = async (text: string, targetLanguage: string): Promise<string> => {
    try {
      console.log(`Translating text: "${text}" to language: "${targetLanguage}"`);
      const params = {
        Text: text,
        SourceLanguageCode: "en",
        TargetLanguageCode: targetLanguage,
      };
      const { TranslatedText } = await translate.translateText(params).promise();
      console.log(`Translated text: "${TranslatedText}"`);
      return TranslatedText;
    } catch (error) {
      console.error("Translation error:", error);
      return text; // Fallback to original text in case of an error
    }
  };
  