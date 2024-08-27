import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../../config";
import { JwtPayload } from "../../interfaces/jwt_payload_interface";
import { sendErrorResponse } from "../../utils/response_handler_util";
import User from "../../models/users_model";

interface AuthRequest extends Request {
  user?: JwtPayload["user"];
}

export default async function (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Get token from header
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer token format

  // Check if not token
  if (!token) {
    return sendErrorResponse({
      res: res,
      message: "Unauthorized",
      errorCode: "UNAUTHORIZED",
      errorDetails: "User authentication is required for this action.",
      status: 401,
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded.user;

    // Check if user still exists in the database
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "The authenticated user no longer exists.",
        status: 404,
      });
    }

    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return sendErrorResponse({
        res: res,
        message: "Token is not valid",
        errorCode: "UNAUTHORIZED",
        errorDetails: "User authentication is required for this action.",
        status: 401,
      });
    }
    console.error("Auth middleware error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: "An unexpected error occurred during authentication.",
      status: 500,
    });
  }
}
