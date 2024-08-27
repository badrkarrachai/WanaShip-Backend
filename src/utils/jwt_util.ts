import jwt from "jsonwebtoken";
import config from "../config";
import { JwtPayload } from "../interfaces/jwt_payload_interface";

const secret = config.jwtSecret;

// Function to generate a unique JWT ID
const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

export const generateToken = (userId: string, userRole: string): string => {
  const payload: JwtPayload = {
    user: {
      id: userId,
      role: userRole,
    },
    iss: config.app.issuer, // Issuer
    sub: userId, // Subject
    aud: config.app.audience, // Audience (can be a string or array of strings)
    iat: Math.floor(Date.now() / 1000), // Issued at (in seconds)
    nbf: Math.floor(Date.now() / 1000), // Not before (in seconds)
    jti: generateUniqueId(), // JWT ID (unique identifier)
  };

  return jwt.sign(payload, secret, { expiresIn: "30d" }); // Short expiration time for increased security
};

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, secret, {
      audience: config.app.audience, // Verify audience
      issuer: config.app.issuer, // Verify issuer
    }) as JwtPayload;
  } catch (err) {
    throw new Error("Invalid token");
  }
};
