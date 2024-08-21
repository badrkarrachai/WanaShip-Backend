import { Request, Response } from "express";
import User from "../../models/users";
import { generateToken } from "../../utils/jwt";
import { sendEmail } from "../../utils/email";
import { readHtmlTemplate } from "../../utils/read_html";
import config from "../../config";
import bcrypt from "bcrypt";
import { generateOTP } from "../../utils/generate_otp";
import { verifyOTPLocally } from "./verify_otp";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";
import { check, validationResult } from "express-validator";

// Request password reset
export const requestPasswordReset = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    // Validation
    await check("email", "Please include a valid email")
      .isEmail()
      .isLength({ max: 250 })
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

    // Generate 6-digit OTP
    const { hashedOtp, otp } = await generateOTP();
    user.resetPasswordOTP = hashedOtp;
    user.resetPasswordOTPExpires = new Date(
      Date.now() + config.otp.expiration * 60 * 1000
    );
    await user.save();

    // Read HTML template and replace placeholders
    let htmlTemplate = readHtmlTemplate("request_otp.html");
    htmlTemplate = htmlTemplate.replace("{{OTP}}", otp);
    htmlTemplate = htmlTemplate.replace(
      "{{EXP-OTP}}",
      config.otp.expiration.toString()
    );

    // Send email
    sendEmail({
      to: user.email,
      subject: "Password Reset OTP",
      html: htmlTemplate,
      text: "",
    });

    return sendSuccessResponse({
      res: res,
      message: "Password reset OTP sent to your email",
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
  const { email, otp, newPassword, confirmPassword } = req.body;
  try {
    // Validation
    await check("email", "Please include a valid email")
      .isEmail()
      .isLength({ max: 250 })
      .run(req);
    await check("otp", "otp is required")
      .exists()
      .isString()
      .isLength({ min: 6, max: 6 })
      .run(req);
    await check(
      "newPassword",
      "Password is required with a minimum length of 6 characters"
    )
      .isLength({ min: 6, max: 250 })
      .run(req);
    await check("confirmPassword", "Passwords do not match")
      .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
          throw new Error("Passwords do not match");
        }
        return true;
      })
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

    let messagesForUser: string[] = [];

    // Get the user with the email
    const user = await User.findOne({ email });
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
    if (!isValid) {
      return sendErrorResponse({
        res: res,
        message: "Invalid or expired OTP",
        errorCode: "INVALID_OTP",
        errorDetails: "The provided OTP is not valid or has expired",
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

    // Check if the account is deleted and if it's been more than 15 days
    if (user.isDeleted && user.deletedAt) {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
      if (user.deletedAt.getTime() < fifteenDaysAgo.getTime()) {
        return sendErrorResponse({
          res: res,
          message: "Account has been permanently deleted",
          errorCode: "ACCOUNT_DELETED",
          errorDetails: "This account has been permanently deleted",
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
      errorDetails: "An unexpected error occurred during password reset",
      status: 500,
    });
  }
};
