import { Request, Response } from "express";
import User from "../../../models/users";
import validator from "validator";
import bcrypt from "bcrypt";
import { generateOTP } from "../../../utils/generate_otp";
import config from "../../../config";
import { readHtmlTemplate } from "../../../utils/read_html";
import { sendEmail } from "../../../utils/email";
import { verifyOTPLocally } from "../../auth_controllers/verify_otp";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../../utils/response_handler";

export const requestUpdateUserEmail = async (req: Request, res: Response) => {
  const { email, currentEmail, currentPassword } = req.body;
  try {
    // Sanitize inputs
    const sanitizedNewEmail = validator.normalizeEmail(email) || "";
    const sanitizedCurrentEmail = validator.normalizeEmail(currentEmail) || "";
    const sanitizedCurrentPassword = validator.escape(currentPassword) || "";

    // Validate email format and length is less than 250
    if (
      !validator.isEmail(sanitizedNewEmail) ||
      !validator.isLength(sanitizedNewEmail, { max: 250 })
    ) {
      return sendErrorResponse({
        res: res,
        message: "Invalid email format",
        errorCode: "INVALID_EMAIL",
        errorDetails:
          "The provided email is not valid or exceeds the maximum length",
      });
    }

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
      subject: "Email Update OTP",
      html: htmlTemplate,
      text: "",
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
export const updateUserEmailViaOTP = async (req: Request, res: Response) => {
  const { email, currentEmail, otp } = req.body;
  try {
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

    // Verify OTP locally
    const isValid = await verifyOTPLocally(user, otp);
    if (!isValid) {
      return sendErrorResponse({
        res: res,
        message: "Invalid or expired OTP",
        errorCode: "INVALID_OTP",
        errorDetails: "The provided OTP is not valid or has expired",
      });
    }

    // Update user email
    user.email = sanitizedNewEmail;
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
      errorDetails: "An unexpected error occurred while updating the email",
      status: 500,
    });
  }
};
