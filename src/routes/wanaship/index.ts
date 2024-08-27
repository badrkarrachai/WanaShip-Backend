import { Router } from "express";
import userRoutes from "./users_routes";
import imageRoutes from "./image_routes";
import authRoutes from "./auth_routes";
import parcelRoutes from "./parcel_routes";
import addressRoutes from "./address_routes";
import { rateLimiterGeneral } from "../../utils/rate_limiter_util";
import express from "express";
import path from "path";
const router = Router();

router.get("/", rateLimiterGeneral, (req, res) => {
  res.send("Welcome");
});
router.use("/user", userRoutes);
router.use("/auth", authRoutes);
router.use("/upload", imageRoutes);
router.use("/parcel", parcelRoutes);
router.use("/address", addressRoutes);

export default router;
