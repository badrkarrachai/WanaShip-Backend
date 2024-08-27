import rateLimit from "express-rate-limit";
import config from "../config";

// Rate limiter to prevent brute force attacks
export const rateLimiterGeneral = rateLimit({
  windowMs: config.rateLimit.windowMs, //Time
  max: config.rateLimit.max, // limit each IP to 5 login requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  keyGenerator: (req) => req.ip,
});
