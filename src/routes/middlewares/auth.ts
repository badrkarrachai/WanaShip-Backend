import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../config";
import { JwtPayload } from "../../interfaces/jwt-payload";
import { sendErrorResponse } from "../../utils/response_handler";

interface AuthRequest extends Request {
  user?: JwtPayload["user"];
}

export default function (req: AuthRequest, res: Response, next: NextFunction) {
  // Get token from header
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer token format

  // Check if not token
  if (!token) {
    return sendErrorResponse({
      res: res,
      message: "Unauthorized",
      errorCode: "UNAUTHORIZED",
      errorDetails: "User authentication is required for this action",
      status: 401,
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded.user;
    next();
  } catch (err) {
    return sendErrorResponse({
      res: res,
      message: "Token is not valid",
      errorCode: "UNAUTHORIZED",
      errorDetails: "User authentication is required for this action",
      status: 401,
    });
  }
}
