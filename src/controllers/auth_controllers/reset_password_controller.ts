import { Request, Response } from "express";
import User from "../../models/users_model";
import { generateToken } from "../../utils/jwt";
import config from "../../config";
import bcrypt from "bcrypt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";
import { check, validationResult } from "express-validator";
import { sendOTP, verifyOTPLocally } from "../../utils/otp";
import {
  requestPasswordResetValidationRules,
  resetPasswordValidationRules,
  validateRequest,
} from "../../utils/validations";

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      requestPasswordResetValidationRules
    );
    if (validationErrors !== "validation successful") {
      return sendErrorResponse({
        res,
        message: "Invalid input",
        errorCode: "INVALID_INPUT",
        errorDetails: validationErrors,
        status: 400,
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "Invalid credentials",
        errorCode: "INVALID_CREDENTIALS",
        errorDetails: "No user found with this email address",
        status: 400,
      });
    }

    // send OTP
    sendOTP({
      userOTP: user,
      subjectOTP: "Reset Password OTP",
    });

    return sendSuccessResponse({
      res: res,
      message: "Reset password OTP sent to your email",
      status: 200,
    });
  } catch (err) {
    console.error("Password reset request error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails:
        "An unexpected error occurred during password reset request",
      status: 500,
    });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      resetPasswordValidationRules
    );
    if (validationErrors !== "validation successful") {
      return sendErrorResponse({
        res,
        message: "Invalid input",
        errorCode: "INVALID_INPUT",
        errorDetails: validationErrors,
        status: 400,
      });
    }

    let messagesForUser: string[] = [];

    // Get the user with the email
    const user = await User.findOne({ email }).populate("avatar");
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "No user found with this email address",
        status: 400,
      });
    }

    // Verify OTP locally
    const isValid = await verifyOTPLocally(user, otp);
    if (isValid === "OTP_EXPIRED") {
      return sendErrorResponse({
        res: res,
        message: "OTP expired",
        errorCode: "EXPIRED_OTP",
        errorDetails: "The provided OTP is expired.",
        status: 400,
      });
    }
    if (!isValid) {
      return sendErrorResponse({
        res: res,
        message: "Invalid OTP",
        errorCode: "INVALID_OTP",
        errorDetails: "The provided OTP is not valid.",
        status: 400,
      });
    }

    // Set new password
    user.password = await bcrypt.hash(newPassword, config.bcrypt.rounds);
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    // Check if the account is activated and not deleted
    if (!user.isActivated) {
      return sendErrorResponse({
        res: res,
        message: "Account is disabled",
        errorCode: "ACCOUNT_DISABLED",
        errorDetails: "Please contact the support team",
        status: 403,
      });
    }

    // Check if the account is deleted and if it's been more than config.app.recoveryPeriod days
    if (user.isDeleted && user.deletedAt) {
      // Current date
      const now = new Date();

      // Recovery period end date (config.app.recoveryPeriod days after `deletedAt`)
      const recoveryEndDate = new Date(
        user.deletedAt.getTime() +
          config.app.recoveryPeriod * 24 * 60 * 60 * 1000
      );

      // Calculate the number of days left in the recovery period
      const daysLeftInRecoveryPeriod = Math.ceil(
        (recoveryEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysLeftInRecoveryPeriod > 0) {
        messagesForUser.push(
          `Your account is in the recovery period. You have ${daysLeftInRecoveryPeriod} day${
            daysLeftInRecoveryPeriod !== 1 ? "s" : ""
          } left to reactivate it.`
        );
      } else {
        return sendErrorResponse({
          res: res,
          message: "Account has been permanently deleted",
          errorCode: "ACCOUNT_DELETED",
          errorDetails:
            "The 15-day recovery period has ended. Your account is scheduled for permanent deletion.",
          status: 403,
        });
      }
    }

    // check is user email verified
    if (!user.emailVerified) {
      messagesForUser.push(`Please verify your email to use full features.`);
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = generateToken(user.id, user.role);

    messagesForUser.push("Your password has been successfully reset.");

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isActivated: user.isActivated,
      preferences: user.preferences,
      notificationSettings: user.notificationSettings,
      messages: messagesForUser,
    };

    return sendSuccessResponse({
      res: res,
      message: "Password reset successful",
      data: {
        token,
        user: userData,
      },
      status: 200,
    });
  } catch (err) {
    console.error("Password reset error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails:
        "An unexpected error occurred during password reset, Please try again later.",
      status: 500,
    });
  }
};
