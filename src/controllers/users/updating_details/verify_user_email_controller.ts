import { Request, Response } from "express";
import User from "../../../models/users_model";
import validator from "validator";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../../utils/response_handler_util";
import { sendOTP, verifyOTPLocally } from "../../../utils/otp_util";
import {
  requestverifyEmailValidationRules,
  validateRequest,
  verifyEmailValidationRules,
} from "../../../utils/validations_util";

// Request user email verification
export const requestVerifyUserEmail = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { email } = req.body;
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      requestverifyEmailValidationRules
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

    // Sanitize inputs
    const sanitizedEmail = validator.normalizeEmail(email) || "";

    // Check if user exists
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "No user found with the provided email.",
        status: 404,
      });
    }

    // Check if user is the owner of the email
    if (user.id !== userId) {
      return sendErrorResponse({
        res: res,
        message: "Unauthorized",
        errorCode: "UNAUTHORIZED",
        errorDetails: "You are not authorized to verify this email.",
        status: 401,
      });
    }

    // Check if user's email is verified
    if (user.emailVerified) {
      return sendErrorResponse({
        res: res,
        message: "Email is already verified",
        errorCode: "EMAIL_ALREADY_VERIFIED",
        errorDetails: "The provided email is already verified.",
      });
    }

    // Send OTP
    sendOTP({
      userOTP: user,
      subjectOTP: "Email Verification OTP",
    });

    // Send response
    return sendSuccessResponse({
      res: res,
      message: "Email verification OTP sent successfully",
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails:
        "An unexpected error occurred while verifying the email, Please try again later.",
      status: 500,
    });
  }
};

// Verify user email via OTP
export const verifyUserEmailViaOTP = async (req: Request, res: Response) => {
  const userId = req.user.id;
  const { email, otp } = req.body;
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      verifyEmailValidationRules
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

    // Sanitize inputs
    const sanitizedEmail = validator.normalizeEmail(email) || "";

    // Get the user with the provided email
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "No user found with the provided email.",
        status: 404,
      });
    }

    // Check if user is the owner of the email
    if (user.id !== userId) {
      return sendErrorResponse({
        res: res,
        message: "Unauthorized",
        errorCode: "UNAUTHORIZED",
        errorDetails: "You are not authorized to verify this email.",
        status: 401,
      });
    }

    // Check if user's email is verified
    if (user.emailVerified) {
      return sendErrorResponse({
        res: res,
        message: "Email is already verified",
        errorCode: "EMAIL_ALREADY_VERIFIED",
        errorDetails: "The provided email is already verified.",
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
      });
    }
    if (!isValid) {
      return sendErrorResponse({
        res: res,
        message: "Invalid OTP",
        errorCode: "INVALID_OTP",
        errorDetails: "The provided OTP is not valid.",
      });
    }

    // Update user emailVerified to true
    user.emailVerified = true;
    await user.save();

    // Send response
    return sendSuccessResponse({
      res: res,
      message: "Email verified successfully",
    });
  } catch (err) {
    console.error("Email verification error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails:
        "An unexpected error occurred while verifying the email, Please try again later.",
      status: 500,
    });
  }
};
