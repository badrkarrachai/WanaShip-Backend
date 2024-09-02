import { Router } from "express";
import { check, validationResult } from "express-validator";
import { register } from "../../controllers/auth_controllers/register_controller";
import { login } from "../../controllers/auth_controllers/login_controller";
import {
  requestPasswordReset,
  resetPassword,
} from "../../controllers/auth_controllers/reset_password_controller";
import { rateLimiterGeneral } from "../../utils/rate_limiter_util";
import { verifyOTP } from "../../controllers/auth_controllers/verify_otp";
import {
  googleAuth,
  googleAuthCallback,
} from "../../controllers/auth_controllers/google_auth_controller";
import {
  discordAuth,
  discordAuthCallback,
} from "../../controllers/auth_controllers/discord_auth_controller";
import { me } from "../../controllers/auth_controllers/me_controller";
import { checkAccountActivated } from "../middlewares/check_account_activated_middleware";
import { auth } from "../middlewares/auth_middleware";
import { refreshToken } from "../../controllers/auth_controllers/refresh_token_controller";
import { logout } from "../../controllers/auth_controllers/logout_controller";

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
router.get("/google", rateLimiterGeneral, googleAuth);
router.get("/google/callback", rateLimiterGeneral, googleAuthCallback);
router.get("/discord", rateLimiterGeneral, discordAuth);
router.get("/discord/callback", rateLimiterGeneral, discordAuthCallback);
router.get("/me", auth, checkAccountActivated, me);
router.post("/refresh-token", refreshToken);
router.post("/logout", auth, logout);

export default router;
