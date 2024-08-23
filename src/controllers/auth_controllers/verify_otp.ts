import { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../../models/users_model";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";
import { verifyOTPLocally } from "../../utils/otp";
import {
  validateRequest,
  verifyOtpValidationRules,
} from "../../utils/validations";

// Step 2: Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  // Validation
  const validationErrors = await validateRequest(
    req,
    res,
    verifyOtpValidationRules
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

  const { email, otp } = req.body;

  try {
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

    // OTP is valid
    return sendSuccessResponse({
      res: res,
      message: "OTP verified successfully",
      status: 200,
    });
  } catch (err) {
    console.error("OTP verification error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "SERVER_ERROR",
      errorDetails:
        "An unexpected error occurred during OTP verification, Please try again later.",
      status: 500,
    });
  }
};
