import { Router } from "express";
import wanaShipRoutes from "./wanaship/index";

const router = Router();

router.use("/wanaship", wanaShipRoutes);

export default router;
