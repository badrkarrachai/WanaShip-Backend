import { Router } from "express";

import auth from "../middlewares/auth";
import {
  requestUpdateUserEmail,
  updateUserEmailViaOTP,
} from "../../controllers/users/updating_details/update_user_email_controller";
import { updateUserName } from "../../controllers/users/updating_details/update_user_name_controller";
import { updateUserPassword } from "../../controllers/users/updating_details/update_user_password_controller";
import { deleteUser } from "../../controllers/users/deletion/delete_user_controller";
import { recoverUser } from "../../controllers/users/deletion/recover_user_controller";
import {
  requestVerifyUserEmail,
  verifyUserEmailViaOTP,
} from "../../controllers/users/updating_details/verify_user_email_controller";

const router = Router();

router.post("/update-user-name", auth, updateUserName);
router.post("/update-user-password", auth, updateUserPassword);
router.post("/request-update-user-email", auth, requestUpdateUserEmail);
router.post("/update-user-email", auth, updateUserEmailViaOTP);
router.get("/delete-user", auth, deleteUser);
router.get("/recover-user", auth, recoverUser);
router.post("/request-verify-user-email", auth, requestVerifyUserEmail);
router.post("/verify-user-email", auth, verifyUserEmailViaOTP);

export default router;
