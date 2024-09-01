import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../utils/jwt_util"; // Update this import path as needed
import { JwtPayload } from "../../interfaces/jwt_payload_interface";
import { sendErrorResponse } from "../../utils/response_handler_util";
import User from "../../models/users_model";

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sendErrorResponse({
      res: res,
      message: "Unauthorized",
      errorCode: "UNAUTHORIZED",
      errorDetails: "No authentication token provided.",
      status: 401,
    });
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded.user;

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
    if (err.name === "TokenExpiredError") {
      return sendErrorResponse({
        res: res,
        message: "Token expired",
        errorCode: "TOKEN_EXPIRED",
        errorDetails: "The provided authentication token has expired.",
        status: 401,
      });
    } else if (err.name === "JsonWebTokenError") {
      return sendErrorResponse({
        res: res,
        message: "Invalid token",
        errorCode: "INVALID_TOKEN",
        errorDetails: "The provided authentication token is invalid.",
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
};
