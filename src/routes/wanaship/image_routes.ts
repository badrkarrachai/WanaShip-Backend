// src/routes/wanaship/image_routes.ts
import { Router } from "express";
import auth from "../middlewares/auth_middleware";
import { uploadImage } from "../../controllers/media_controllers/image_controller";
import {
  uploadMultipleImages,
  uploadSingleImage,
} from "../middlewares/upload_middleware";

const router = Router();

// Route for uploading a single profile picture
router.post("/single", auth, (req, res, next) => {
  uploadSingleImage(req, res, (err) =>
    uploadImage("single", err, req, res, next)
  );
});

// Route for uploading multiple parcel images
router.post("/multiple", auth, (req, res, next) => {
  uploadMultipleImages(req, res, (err) =>
    uploadImage("multiple", err, req, res, next)
  );
});

export default router;
