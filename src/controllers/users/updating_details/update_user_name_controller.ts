import { Request, Response } from "express";
import User from "../../../models/users";
import validator from "validator";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../../utils/response_handler";

export const updateUserName = async (req: Request, res: Response) => {
  const { email, name } = req.body;
  try {
    // Validate inputs
    if (!email || !name) {
      return sendErrorResponse({
        res: res,
        message: "Email and name are required",
        errorCode: "MISSING_CREDENTIALS",
        errorDetails: "Both email and name must be provided",
      });
    }

    // Sanitize and validate inputs
    const sanitizedName = validator.trim(validator.escape(name));
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

    if (!validator.isLength(sanitizedName, { min: 2, max: 50 })) {
      return sendErrorResponse({
        res: res,
        message: "Name must be between 2 and 50 characters",
        errorCode: "INVALID_NAME",
        errorDetails: "The provided name must be between 2 and 50 characters",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "User not found",
        errorCode: "USER_NOT_FOUND",
        errorDetails: "No user found with the provided current email",
        status: 404,
      });
    }

    // Check if the new name is different from the current name
    if (user.name === sanitizedName) {
      return sendErrorResponse({
        res: res,
        message: "New name must be different",
        errorCode: "SAME_NAME",
        errorDetails: "The new name must be different from the current name",
      });
    }

    // Update user name
    user.name = sanitizedName;
    await user.save();

    // Send response
    sendSuccessResponse({
      res: res,
      message: "User name updated successfully",
      data: { name: sanitizedName },
    });
  } catch (err) {
    console.error("User name update error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails: "An unexpected error occurred while updating the name",
      status: 500,
    });
  }
};
