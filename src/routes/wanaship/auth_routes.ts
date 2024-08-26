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
import {
  googleAuth,
  googleAuthCallback,
} from "../../controllers/auth_controllers/google_auth_controller";
import {
  discordAuth,
  discordAuthCallback,
} from "../../controllers/auth_controllers/discord_auth_controller";

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
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthCallback);
router.get("/discord", discordAuth);
router.get("/discord/callback", discordAuthCallback);

export default router;
