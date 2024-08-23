import { Request, Response } from "express";
import User from "../../../models/users_model";
import bcrypt from "bcrypt";
import validator from "validator";
import config from "../../../config";
import { sendErrorResponse } from "../../../utils/response_handler";
import {
  updateProfilePasswordValidationRules,
  validateRequest,
} from "../../../utils/validations";

export const updateUserPassword = async (req: Request, res: Response) => {
  const { email, currentPassword, newPassword, confirmPassword } = req.body;
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      updateProfilePasswordValidationRules
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

    // Sanitize and validate email
    const sanitizedEmail = validator.normalizeEmail(email) || "";

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
      errorDetails:
        "An unexpected error occurred while updating the password, Please try again later.",
      status: 500,
    });
  }
};
