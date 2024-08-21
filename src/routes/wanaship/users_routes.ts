import { Router } from "express";

import auth from "../middlewares/auth";
import {
  requestUpdateUserEmail,
  updateUserEmailViaOTP,
} from "../../controllers/users/updating_details/update_user_email_controller";
import { updateUserName } from "../../controllers/users/updating_details/update_user_name_controller";
import { updateUserPassword } from "../../controllers/users/updating_details/update_user_password_controller";
import { check, validationResult } from "express-validator";
import { verifyOTP } from "../../controllers/auth_controllers/verify_otp";
import { deleteUser } from "../../controllers/users/deletion/delete_user_controller";
import { recoverUser } from "../../controllers/users/deletion/recover_user_controller";
import { sendErrorResponse } from "../../utils/response_handler";

const router = Router();

router.post("/update-user-name", auth, updateUserName);
router.post("/update-user-password", auth, updateUserPassword);
router.post("/request-update-user-email", auth, requestUpdateUserEmail);
router.post("/update-user-email", auth, updateUserEmailViaOTP);
router.get("/delete-user", auth, deleteUser);
router.get("/recover-user", auth, recoverUser);

export default router;
