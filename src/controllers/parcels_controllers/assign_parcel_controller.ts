import { Response, Request } from "express";
import Parcel, { STATUS } from "../../models/parcel_model";
import User from "../../models/users_model";
import {
  sendSuccessResponse,
  sendErrorResponse,
} from "../../utils/response_handler_util";
import { isValidObjectId, Types } from "mongoose";
import { formatParcelData } from "../../utils/responces_templates/parcel_response_template";
import { ROLES } from "../../config/permissions";

export const assignParcel = async (req: Request, res: Response) => {
  try {
    const { parcelId, reshipperId } = req.body;

    // Input validation
    if (
      !parcelId ||
      !reshipperId ||
      !isValidObjectId(parcelId) ||
      !isValidObjectId(reshipperId)
    ) {
      return sendErrorResponse({
        res,
        message: "Invalid input",
        errorCode: "INVALID_INPUT",
        errorDetails:
          "Both parcelId and reshipperId must be valid and provided.",
        status: 400,
      });
    }

    // Check if the parcel exists
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      return sendErrorResponse({
        res,
        message: "Parcel not found",
        errorCode: "NOT_FOUND",
        errorDetails: "The specified parcel does not exist.",
        status: 404,
      });
    }

    // Check if the reshipper exists and is valid
    const reshipper = await User.findOne({
      _id: reshipperId,
      role: ROLES.RESHIPPER,
    });
    if (!reshipper) {
      return sendErrorResponse({
        res,
        message: "Invalid reshipper",
        errorCode: "INVALID_RESHIPPER",
        errorDetails:
          "The specified reshipper does not exist or is not a valid reshipper.",
        status: 400,
      });
    }

    // Check if the parcel is already assigned
    if (parcel.reshipperId) {
      return sendErrorResponse({
        res,
        message: "Parcel already assigned to another reshipper",
        errorCode: "PARCEL_ALREADY_ASSIGNED",
        errorDetails:
          "The specified parcel is already assigned to another reshipper.",
        status: 400,
      });
    }

    // Assign the parcel
    parcel.reshipperId = new Types.ObjectId(reshipperId);
    parcel.status = STATUS.PENDING;
    await parcel.save();
    const parcelData = await formatParcelData(parcel);
    return sendSuccessResponse({
      res,
      message: "Parcel assigned to reshipper successfully",
      data: parcelData,
    });
  } catch (err) {
    console.error("Error assigning parcel:", err);
    return sendErrorResponse({
      res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: "An unexpected error occurred while assigning the parcel.",
      status: 500,
    });
  }
};
