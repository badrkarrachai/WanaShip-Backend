import { Request, Response } from "express";
import User from "../../models/users_model";
import { generateToken } from "../../utils/jwt";
import sanitize from "mongo-sanitize";
import bcrypt from "bcrypt";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";
import { loginValidationRules, validateRequest } from "../../utils/validations";
import config from "../../config";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validation
  const validationErrors = await validateRequest(
    req,
    res,
    loginValidationRules
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

  // Sanitize input to prevent NoSQL injection
  const sanitizedEmail = sanitize(email);

  try {
    let messagesForUser: string[] = [];

    // Find the user by sanitized email
    const user = await User.findOne({ email: sanitizedEmail }).populate(
      "avatar"
    );
    if (!user) {
      return sendErrorResponse({
        res: res,
        message: "Invalid credentials",
        errorCode: "INVALID_CREDENTIALS",
        errorDetails: "There is no account associated with this email.",
      });
    }

    // Check if the account is activated and not deleted
    if (!user.isActivated) {
      return sendErrorResponse({
        res: res,
        message: "Your account is disabled",
        errorCode: "ACCOUNT_DISABLED",
        errorDetails:
          "Account is not activated, please contact the support team.",
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
        errorDetails:
          "Password is incorrect, please try again with a different password.",
      });
    }

    // check is user email verified
    if (!user.emailVerified) {
      messagesForUser.push(`Please verify your email to use full features.`);
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
      errorDetails: "An unexpected error occurred, Please try again later.",
      status: 500,
    });
  }
};
