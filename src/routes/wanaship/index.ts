import { Router } from "express";
import userRoutes from "./users_routes";

import authRoutes from "./auth";
import { rateLimiterGeneral } from "../../utils/rate_limiter";

const router = Router();

router.get("/", rateLimiterGeneral, (req, res) => {
  res.send("Welcome");
});
router.use("/user", userRoutes);
router.use("/auth", authRoutes);

export default router;
