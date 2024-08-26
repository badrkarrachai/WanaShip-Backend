import { Request, Response } from "express";
import User from "../../../models/users_model";
import validator from "validator";
import bcrypt from "bcrypt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../../utils/response_handler";
import { sendOTP, verifyOTPLocally } from "../../../utils/otp";
import {
  updateProfileEmailValidationRules,
  updateProfileEmailViaOTPValidationRules,
  validateRequest,
} from "../../../utils/validations";
import { AuthRequest } from "../../../interfaces/auth_request_interface";

export const requestUpdateUserEmail = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user.id;
  const { email, currentEmail, currentPassword } = req.body;
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      updateProfileEmailValidationRules
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
    const sanitizedNewEmail = validator.normalizeEmail(email) || "";
    const sanitizedCurrentEmail = validator.normalizeEmail(currentEmail) || "";
    const sanitizedCurrentPassword = validator.escape(currentPassword) || "";

    // Check if new email is different from current email
    if (sanitizedNewEmail === sanitizedCurrentEmail) {
      return sendErrorResponse({
        res: res,
        message: "New email must be different",
        errorCode: "SAME_EMAIL",
        errorDetails: "The new email must be different from the current email",
      });
    }

    // Check if user exists with current email
    const user = await User.findOne({ email: sanitizedCurrentEmail });
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "No user found with the provided current email",
        status: 404,
      });
    }

    // Check if user is trying to update their own email
    if (userId !== user.id) {
      return sendErrorResponse({
        res: res,
        message: "Unauthorized",
        errorCode: "UNAUTHORIZED",
        errorDetails: "You are not authorized to update this user's email.",
        status: 401,
      });
    }

    // Check if current password is correct
    if (!(await bcrypt.compare(sanitizedCurrentPassword, user.password))) {
      return sendErrorResponse({
        res: res,
        message: "Current password is incorrect",
        errorCode: "INCORRECT_PASSWORD",
        errorDetails: "The provided current password is incorrect",
      });
    }

    // Check if new email is already in use
    const emailExists = await User.findOne({ email: sanitizedNewEmail });
    if (emailExists) {
      return sendErrorResponse({
        res: res,
        message: "Email already in use",
        errorCode: "EMAIL_IN_USE",
        errorDetails:
          "The new email address is already associated with another account",
      });
    }

    // send OTP
    sendOTP({
      userOTP: user,
      subjectOTP: "Email Update OTP",
    });

    // Send response
    return sendSuccessResponse({
      res: res,
      message: "Email update OTP sent successfully",
    });
  } catch (err) {
    console.error("User email update error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails: "An unexpected error occurred while processing the request",
      status: 500,
    });
  }
};

// Update user email via OTP
export const updateUserEmailViaOTP = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user.id;
  const { email, currentEmail, otp } = req.body;
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      updateProfileEmailViaOTPValidationRules
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
    const sanitizedCurrentEmail = validator.normalizeEmail(currentEmail) || "";
    const sanitizedNewEmail = validator.normalizeEmail(email) || "";

    // Get the user with the current email
    const user = await User.findOne({ email: sanitizedCurrentEmail });
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "No user found with the provided current email",
        status: 404,
      });
    }

    // Check if user is trying to update their own email
    if (userId !== user.id) {
      return sendErrorResponse({
        res: res,
        message: "Unauthorized",
        errorCode: "UNAUTHORIZED",
        errorDetails: "You are not authorized to update this user's email.",
        status: 401,
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

    // Update user email
    user.email = sanitizedNewEmail;
    user.emailVerified = true;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;
    await user.save();

    // OTP is valid
    return sendSuccessResponse({
      res: res,
      message: "Email updated successfully",
      data: {
        newEmail: sanitizedNewEmail,
      },
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails:
        "An unexpected error occurred while updating the email, Please try again later.",
      status: 500,
    });
  }
};
