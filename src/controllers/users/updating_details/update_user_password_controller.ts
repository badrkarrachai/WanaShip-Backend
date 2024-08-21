import { Request, Response } from "express";
import User from "../../../models/users";
import bcrypt from "bcrypt";
import validator from "validator";
import config from "../../../config";
import { sendErrorResponse } from "../../../utils/response_handler";

export const updateUserPassword = async (req: Request, res: Response) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;
  try {
    // Validate inputs
    if (!email || !currentPassword || !newPassword) {
      return sendErrorResponse({
        res: res,
        message: "Email, current password, and new password are required",
        errorCode: "MISSING_CREDENTIALS",
        errorDetails:
          "Both email, current password, and new password must be provided",
      });
    }

    // Sanitize and validate email
    const sanitizedEmail = validator.normalizeEmail(email) || "";

    // Check if email is valid and length is less than 250
    if (
      !validator.isEmail(sanitizedEmail) ||
      !validator.isLength(sanitizedEmail, { max: 250 })
    ) {
      return sendErrorResponse({
        res: res,
        message: "Invalid email format",
        errorCode: "INVALID_EMAIL",
        errorDetails:
          "The provided email is not valid or exceeds the maximum length",
      });
    }

    // Validate new password
    if (newPassword.length < 8) {
      return sendErrorResponse({
        res: res,
        message: "New password must be at least 8 characters long",
        errorCode: "INVALID_PASSWORD",
        errorDetails:
          "The provided new password must be at least 8 characters long",
      });
    }

    // Validate confirm password
    if (newPassword !== confirmPassword) {
      return sendErrorResponse({
        res: res,
        message: "Passwords do not match",
        errorCode: "PASSWORD_MISMATCH",
        errorDetails:
          "The new password and confirmation password must be identical",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "No user found with the provided email",
        status: 404,
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendErrorResponse({
        res: res,
        message: "Current password is incorrect",
        errorCode: "INCORRECT_PASSWORD",
        errorDetails: "The provided current password is incorrect",
      });
    }

    // Check if new password is different from current password
    if (currentPassword === newPassword) {
      return sendErrorResponse({
        res: res,
        message: "New password must be different",
        errorCode: "SAME_PASSWORD",
        errorDetails:
          "The new password must be different from the current password",
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(config.bcrypt.rounds);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Send response
    res.json({ msg: "User password updated successfully" });
  } catch (err) {
    console.error("User password update error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails: "An unexpected error occurred while updating the password",
      status: 500,
    });
  }
};
