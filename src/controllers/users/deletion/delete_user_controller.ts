import { Request, Response } from "express";
import User from "../../../models/users";
import { JwtPayload } from "../../../interfaces/jwt-payload";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../../utils/response_handler";

interface AuthRequest extends Request {
  user?: JwtPayload["user"];
}

// Delete user
export const deleteUser = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return sendErrorResponse({
      res: res,
      message: "Unauthorized",
      errorCode: "UNAUTHORIZED",
      errorDetails: "User authentication is required for this action",
      status: 401,
    });
  }

  const userId = req.user.id;
  const { reasons } = req.body;

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "The requested user could not be found",
        status: 404,
      });
    }

    // Validate reasons
    if (!Array.isArray(reasons)) {
      return sendErrorResponse({
        res: res,
        message: "Invalid reasons format",
        errorCode: "INVALID_REASONS",
        errorDetails: "Reasons must be provided as an array",
      });
    }

    // Check if reasons are empty
    let finalReasons = reasons.length === 0 ? ["Others"] : reasons;

    // Check if the user is already deleted
    if (user.isDeleted) {
      return sendErrorResponse({
        res: res,
        message: "User is already deleted",
        errorCode: "USER_ALREADY_DELETED",
        errorDetails: "This user account has already been deleted",
      });
    }

    // Soft delete the user
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.reasonForDeletion = finalReasons;
    await user.save();

    // Send response
    return sendSuccessResponse({
      res: res,
      message: "User deleted successfully",
      data: {
        deletedAt: user.deletedAt,
        reasons: user.reasonForDeletion,
        logout: true,
      },
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails: "An unexpected error occurred while deleting the user",
      status: 500,
    });
  }
};
