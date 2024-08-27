import { Router } from "express";
import wanaShipRoutes from "./wanaship/index";

const router = Router();

router.use("/", wanaShipRoutes);

export default router;
