import { Router } from "express";
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
import {
  removeUserProfilePicture,
  updateUserProfilePicture,
} from "../../controllers/users/updating_details/update_user_avatar_controller";
import { checkAccountNotDeleted } from "../middlewares/check_account_deleted_middleware";
import { checkAccountActivated } from "../middlewares/check_account_activated_middleware";
import { authenticateToken } from "../middlewares/auth_middleware";

const router = Router();

const checkAD = [checkAccountNotDeleted, checkAccountActivated];

router.post("/update-user-name", authenticateToken, checkAD, updateUserName);
router.post(
  "/update-user-password",
  authenticateToken,
  checkAD,
  updateUserPassword
);
router.post(
  "/request-update-user-email",
  authenticateToken,
  checkAD,
  requestUpdateUserEmail
);
router.post(
  "/update-user-email",
  authenticateToken,
  checkAD,
  updateUserEmailViaOTP
);
router.get("/delete-user", authenticateToken, deleteUser);
router.get("/recover-user", authenticateToken, recoverUser);
router.post(
  "/request-verify-user-email",
  authenticateToken,
  checkAD,
  requestVerifyUserEmail
);
router.post(
  "/verify-user-email",
  authenticateToken,
  checkAD,
  verifyUserEmailViaOTP
);
router.put(
  "/update-profile-picture",
  authenticateToken,
  checkAD,
  updateUserProfilePicture
);
router.delete(
  "/delete-profile-picture",
  authenticateToken,
  checkAD,
  removeUserProfilePicture
);

export default router;
