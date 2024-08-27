import { Router } from "express";

import auth from "../middlewares/auth_middleware";
import { createParcel } from "../../controllers/parcels_controllers/create_parcel_controller";

const router = Router();

router.post("/create-parcel", auth, createParcel);

export default router;
