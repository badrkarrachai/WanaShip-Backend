import { Router } from "express";

import auth from "../middlewares/auth_middleware";
import { createParcel } from "../../controllers/parcels_controllers/create_parcel_controller";
import { deleteParcel } from "../../controllers/parcels_controllers/delete_parcel_controller";
import { listParcels } from "../../controllers/parcels_controllers/list_parcels_controller";

const router = Router();

router.post("/create-parcel", auth, createParcel);
router.delete("/delete-parcel", auth, deleteParcel);
router.get("/list-parcel", auth, listParcels);

export default router;
