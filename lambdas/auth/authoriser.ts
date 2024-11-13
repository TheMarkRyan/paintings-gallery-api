import { APIGatewayRequestAuthorizerHandler } from "aws-lambda";
import { verifyToken, parseCookies, createPolicy } from "../../shared/util";

export const handler: APIGatewayRequestAuthorizerHandler = async (event) => {
  const cookies = parseCookies(event);

  if (!cookies || !cookies.token) {
    return {
      principalId: "",
      policyDocument: createPolicy(event, "Deny"),
    };
  }

  const userPoolId = process.env.USER_POOL_ID;
  if (!userPoolId) {
    console.error("USER_POOL_ID is not set in environment variables.");
    return {
      principalId: "",
      policyDocument: createPolicy(event, "Deny"),
    };
  }

  const verifiedJwt = await verifyToken(cookies.token, userPoolId, process.env.REGION || "us-east-1");

  return {
    principalId: verifiedJwt ? verifiedJwt.sub : "",
    policyDocument: createPolicy(event, verifiedJwt ? "Allow" : "Deny"),
  };
};
