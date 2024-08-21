import config from "../config";
import bcrypt from "bcrypt";

// Generate 6-digit OTP
export const generateOTP = async () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = await bcrypt.hash(otp, config.bcrypt.rounds);
  return { hashedOtp: hashedOtp, otp: otp };
};
