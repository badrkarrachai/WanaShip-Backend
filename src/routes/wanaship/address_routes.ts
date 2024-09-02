import { Router } from "express";

import { createAddress } from "../../controllers/addresses_controllers/create_address_controller";
import { auth } from "../middlewares/auth_middleware";

const router = Router();

router.post("/create-address", auth, createAddress);

export default router;
