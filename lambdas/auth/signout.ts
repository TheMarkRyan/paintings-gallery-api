import { APIGatewayProxyResult } from "aws-lambda";

export const handler = async (): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": "token=; HttpOnly; Path=/; Max-Age=0;",
    },
    body: JSON.stringify({ message: "Sign-out successful" }),
  };
};
