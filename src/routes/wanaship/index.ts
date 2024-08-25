import { Router } from "express";
import userRoutes from "./users_routes";
import imageRoutes from "./image_routes";
import authRoutes from "./auth_routes";
import { rateLimiterGeneral } from "../../utils/rate_limiter";
import express from "express";
import path from "path";
const router = Router();

router.get("/", rateLimiterGeneral, (req, res) => {
  res.send("Welcome");
});
router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/upload", imageRoutes);

export default router;
