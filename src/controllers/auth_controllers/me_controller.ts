import { AuthRequest } from "../../interfaces/auth_request_interface";
import User from "../../models/users_model";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/response_handler";
import { Request, Response } from "express";
import { formatUserData } from "../../utils/user_utils";
import { checkAccountRecoveryStatus } from "../../utils/account_deletion_check";
import config from "../../config";

export const me = async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  try {
    // Look up user by id
    const user = await User.findOne({ _id: userId }).populate("avatar");
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "Invalid session",
        errorCode: "INVALID_CREDENTIALS",
        errorDetails: "There is no active session for this token.",
      });
    }

    // Check if the account is activated
    if (!user.isActivated) {
      return sendErrorResponse({
        res: res,
        message: "Your account is disabled",
        errorCode: "ACCOUNT_DISABLED",
        errorDetails:
          "Account is not activated, please contact the support team.",
      });
    }

    const recoveryMessage = checkAccountRecoveryStatus(
      user,
      config.app.recoveryPeriod,
      res
    );
    if (recoveryMessage === "deleted") {
      return sendErrorResponse({
        res: res,
        message: "Account has been permanently deleted",
        errorCode: "ACCOUNT_DELETED",
        errorDetails:
          "The recovery period has ended. Your account is scheduled for permanent deletion.",
        status: 403,
      });
    }

    // Prepare user data for response
    const userData = formatUserData(user);

    // Send response
    return sendSuccessResponse({
      res: res,
      message: "User details fetched successfully",
      data: userData,
    });
  } catch (err) {
    console.error("Login error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: "An unexpected error occurred, Please try again later.",
      status: 500,
    });
  }
};
