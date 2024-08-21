import { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import User from "../../models/users";
import bcrypt from "bcrypt";
import { IUser } from "../../interfaces/user";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler";

// Step 2: Verify OTP
export const verifyOTP = async (req: Request, res: Response) => {
  // Validation
  await check("otp", "otp is required")
    .exists()
    .isString()
    .isLength({ min: 6, max: 6 })
    .run(req);
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

    if (!(await verifyOTPLocally(user, otp))) {
      return sendErrorResponse({
        res: res,
        message: "Invalid or expired OTP",
        errorCode: "INVALID_OTP",
        errorDetails: "The provided OTP is not valid or has expired",
        status: 400,
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
      errorDetails: "An unexpected error occurred during OTP verification",
      status: 500,
    });
  }
};

export const verifyOTPLocally = async (
  user: IUser,
  otp: string
): Promise<boolean> => {
  // Ensure otp and user.resetPasswordOTP are strings
  const otpString = otp as string;
  const hashedOtpString = user.resetPasswordOTP as string;

  if (
    !user ||
    !user.resetPasswordOTPExpires ||
    user.resetPasswordOTPExpires.getTime() < Date.now()
  ) {
    return false;
  }

  const isMatch = await bcrypt.compare(otpString, hashedOtpString);
  return isMatch;
};
