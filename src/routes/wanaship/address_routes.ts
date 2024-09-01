import { Router } from "express";

import { createAddress } from "../../controllers/addresses_controllers/create_address_controller";
import { authenticateToken } from "../middlewares/auth_middleware";

const router = Router();

router.post("/create-address", authenticateToken, createAddress);

export default router;
