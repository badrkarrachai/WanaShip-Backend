import { Router } from "express";
import auth from "../middlewares/auth_middleware";
import { createAddress } from "../../controllers/addresses_controllers/create_address_controller";

const router = Router();

router.post("/create-address", auth, createAddress);

export default router;
