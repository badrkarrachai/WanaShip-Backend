import { Request, Response } from "express";
import { sendEmail } from "./email";
import { readHtmlTemplate } from "../utils/read_html";
import config from "../config";
import bcrypt from "bcrypt";
import { IUser } from "../interfaces/user";

interface OTPOptions {
  lengthOTP: number;
  expirationOTP: number;
  userOTP: IUser;
  subjectOTP: string;
}

const defaultOptions: Partial<OTPOptions> = {
  lengthOTP: 6,
  expirationOTP: 10,
};

// Generate OTP
export const generateOTP = async (length: number = 6) => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const otp = Math.floor(min + Math.random() * (max - min + 1)).toString();
  const hashedOtp = await bcrypt.hash(otp, config.bcrypt.rounds);
  return { hashedOtp, otp };
};

export const sendOTP = async (
  options: Partial<OTPOptions> = {}
): Promise<void> => {
  const mergedOptions = { ...defaultOptions, ...options };
  const { lengthOTP, expirationOTP, userOTP, subjectOTP } = mergedOptions;

  if (!userOTP) {
    throw new Error("User is required");
  }

  // Generate OTP
  const { hashedOtp, otp } = await generateOTP(lengthOTP);

  // Update user with OTP info
  userOTP.resetPasswordOTP = hashedOtp;
  userOTP.resetPasswordOTPExpires = new Date(
    Date.now() + expirationOTP * 60 * 1000
  );
  await userOTP.save();

  // Read HTML template and replace placeholders
  let htmlTemplate = readHtmlTemplate("request_otp.html");
  htmlTemplate = htmlTemplate.replace("{{OTP}}", otp);
  htmlTemplate = htmlTemplate.replace("{{EXP-OTP}}", expirationOTP.toString());

  // Send email
  await sendEmail({
    to: userOTP.email,
    subject: subjectOTP,
    html: htmlTemplate,
    text: otp, // Provide a plain text version as fallback
  });
};

export const verifyOTPLocally = async (
  user: IUser,
  otp: string
): Promise<any> => {
  // Ensure otp and user.resetPasswordOTP are strings
  const otpString = otp as string;
  const hashedOtpString = user.resetPasswordOTP as string;

  if (
    !user ||
    !user.resetPasswordOTPExpires ||
    user.resetPasswordOTPExpires.getTime() < Date.now()
  ) {
    return "OTP_EXPIRED";
  }

  const isMatch = await bcrypt.compare(otpString, hashedOtpString);
  return isMatch;
};
