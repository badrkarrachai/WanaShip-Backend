import dotenv from "dotenv";
import e from "express";

process.env.NODE_ENV = process.env.NODE_ENV || "development";

const envFound = dotenv.config();

if (envFound.error) {
  throw new Error("no .env file found");
}

export default {
  app: {
    port: parseInt(process.env.PORT, 10),
    baseUrl: process.env.BASE_URL,
    apiPrefix: process.env.API_PREFIX,
    appName: process.env.APP_NAME,
    issuer: process.env.ISSUER,
    version: process.env.APP_VERSION,
    audience: process.env.AUDIENCE,
    recoveryPeriod: parseInt(process.env.ACCOUNT_RECOVERY_PERIOD, 10),
  },
  logs: {
    morgan: process.env.MORGAN,
  },
  mongodb: {
    url: process.env.MONGODB_URL,
  },
  jwtSecret: process.env.JWT_SECRET,
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    appName: process.env.APP_NAME,
    pass: process.env.EMAIL_PASS,
  },
  otp: {
    expiration: parseInt(process.env.OTP_EXPIRATION, 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10),
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10),
  },
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  discord: {
    clientID: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
  },
};
