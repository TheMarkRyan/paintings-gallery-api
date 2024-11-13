// shared/util.ts

import { marshall } from "@aws-sdk/util-dynamodb";
import { Painting, Artist, PaintingArtistLink } from "./types";
import * as jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import axios from 'axios';

type Entity = Painting | Artist | PaintingArtistLink;

export const generateItem = (entity: Entity) => {
  return {
    PutRequest: {
      Item: marshall(entity),
    },
  };
};

export const generateBatch = (data: Entity[]) => {
  return data.map((e) => generateItem(e));
};

// Utility function to parse cookies from the event headers
export const parseCookies = (event: any): { [key: string]: string } | undefined => {
  const cookiesStr = event.headers?.Cookie;
  if (!cookiesStr) return undefined;

  const cookiesArr = cookiesStr.split(';');
  const cookieMap: { [key: string]: string } = {};

  cookiesArr.forEach((cookie: string) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) { 
      cookieMap[key] = value;
    }
  });

  return cookieMap;
};

// Utility function to verify the JWT token against the Cognito User Pool's JWKS
export const verifyToken = async (token: string, userPoolId: string, region: string): Promise<any> => {
  try {
    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    const { data } = await axios.get(url);
    const pem = jwkToPem(data.keys[0]);  // Convert the JWK to PEM

    return jwt.verify(token, pem, { algorithms: ['RS256'] });
  } catch (err) {
    console.error('Error verifying token:', err);
    return null;
  }
};

// Utility function to create IAM policy based on verification result
export const createPolicy = (event: any, effect: 'Allow' | 'Deny') => {
  return {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: effect,
        Action: "execute-api:Invoke",
        Resource: event.methodArn,
      },
    ],
  };
};
