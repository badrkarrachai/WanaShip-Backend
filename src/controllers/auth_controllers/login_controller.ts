import { Request, Response } from "express";
import User from "../../models/users";
import { generateToken } from "../../utils/jwt";
import sanitize from "mongo-sanitize";
import bcrypt from "bcrypt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";
import { check, validationResult } from "express-validator";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  await check("email", "Please include a valid email")
    .isEmail()
    .isLength({ max: 250 })
    .run(req);
  await check("password", "Password is required")
    .isLength({ min: 6, max: 250 })
    .run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array()[0].msg;
    return sendErrorResponse({
      res: res,
      message: "Invalid input",
      errorCode: "INVALID_INPUT",
      errorDetails: errorDetails,
      status: 400,
    });
  }

  // Sanitize input to prevent NoSQL injection
  const sanitizedEmail = sanitize(email);

  try {
    let messagesForUser: string[] = [];

    // Find the user by sanitized email
    const user = await User.findOne({ email: sanitizedEmail });
    if (!user) {
      console.log(
        `Login attempt failed: User not found for email ${sanitizedEmail}`
      );
      return sendErrorResponse({
        res: res,
        message: "Invalid credentials",
        errorCode: "INVALID_CREDENTIALS",
        errorDetails: "User not found",
      });
    }

    // Check if the account is activated and not deleted
    if (!user.isActivated) {
      return sendErrorResponse({
        res: res,
        message: "Your account is disabled",
        errorCode: "ACCOUNT_DISABLED",
        errorDetails: "Account is not activated",
      });
    }

    // Check if the account is deleted and if it's been more than 15 days
    if (user.isDeleted && user.deletedAt) {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      if (user.deletedAt.getTime() < fifteenDaysAgo.getTime()) {
        return sendErrorResponse({
          res: res,
          message: "Account has been permanently deleted",
          errorCode: "ACCOUNT_DELETED",
          errorDetails: "Account deletion period has expired",
          status: 403,
        });
      } else {
        const daysLeft = Math.ceil(
          (user.deletedAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        messagesForUser.push(
          `Your account is scheduled for deletion. You have ${daysLeft} day${
            daysLeft !== 1 ? "s" : ""
          } left to reactivate it.`
        );
      }
    }

    // Check password
    const isMatch = await bcrypt.compare(
      password as string,
      user.password as string
    );
    if (!isMatch) {
      return sendErrorResponse({
        res: res,
        message: "Invalid credentials",
        errorCode: "INVALID_CREDENTIALS",
        errorDetails: "Password does not match",
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user.id, user.role);

    // Prepare user data for response
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

    // Send response
    return sendSuccessResponse({
      res: res,
      message: "Login successful",
      data: {
        token,
        user: userData,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: "An unexpected error occurred",
      status: 500,
    });
  }
};
