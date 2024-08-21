import { Router } from "express";
import { check, validationResult } from "express-validator";
import { register } from "../../controllers/auth_controllers/register_controller";
import { login } from "../../controllers/auth_controllers/login_controller";
import {
  requestPasswordReset,
  resetPassword,
} from "../../controllers/auth_controllers/reset_password_controller";
import { rateLimiterGeneral } from "../../utils/rate_limiter";
import { verifyOTP } from "../../controllers/auth_controllers/verify_otp";

const router = Router();

router.post("/login", rateLimiterGeneral, login);
router.post("/register", rateLimiterGeneral, register);
router.post(
  "/reset-password-request",
  rateLimiterGeneral,
  requestPasswordReset
);
router.post("/verify-otp", rateLimiterGeneral, verifyOTP);
router.post("/reset-password", rateLimiterGeneral, resetPassword);

export default router;
