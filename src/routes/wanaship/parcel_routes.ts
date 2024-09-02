import { Router } from "express";

import { createParcel } from "../../controllers/parcels_controllers/create_parcel_controller";
import { deleteParcel } from "../../controllers/parcels_controllers/delete_parcel_controller";
import { listParcels } from "../../controllers/parcels_controllers/list_parcels_controller";
import { assignParcel } from "../../controllers/parcels_controllers/assign_parcel_controller";
import { checkPermission } from "../middlewares/check_permissions_middleware";
import { PERMISSIONS } from "../../config/permissions";
import { checkEmailVerified } from "../middlewares/check_email_verified_middleware";
import { checkAccountNotDeleted } from "../middlewares/check_account_deleted_middleware";
import { checkAccountActivated } from "../middlewares/check_account_activated_middleware";
import { auth } from "../middlewares/auth_middleware";

const router = Router();

//Checking if the user is not deleted, activated and verified
const checkingEDA = [
  checkAccountNotDeleted,
  checkAccountActivated,
  checkEmailVerified,
];

router.post(
  "/create-parcel",
  auth,
  checkingEDA,
  checkPermission(PERMISSIONS.CREATE_PARCEL),
  createParcel
);
router.delete(
  "/delete-parcel",
  auth,
  checkingEDA,
  checkPermission(PERMISSIONS.DELETE_PARCEL),
  deleteParcel
);
router.get(
  "/list-parcel",
  auth,
  checkingEDA,
  checkPermission(PERMISSIONS.LIST_PARCEL),
  listParcels
);
router.post(
  "/assign-parcel",
  auth,
  checkingEDA,
  checkPermission(PERMISSIONS.ASSIGN_PARCEL),
  assignParcel
);
export default router;
