import { AuthRequest } from "../../interfaces/auth_request_interface";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/response_handler_util";
import {
  deleteParcelValidationRules,
  validateRequest,
} from "../../utils/validations_util";
import sanitize from "mongo-sanitize";
import Parcel from "../../models/parcel_model";
import mongoose from "mongoose";
import { Response } from "express";
import { formatParcelData } from "../../utils/responces_templates/parcel_response_template";

export const deleteParcel = async (req: AuthRequest, res: Response) => {
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      deleteParcelValidationRules
    );
    if (validationErrors !== "validation successful") {
      return sendErrorResponse({
        res,
        message: "Invalid input",
        errorCode: "INVALID_INPUT",
        errorDetails: validationErrors,
        status: 400,
      });
    }

    // Get and sanitize data from the request
    const userId = req.user.id;
    const { parcelId, referenceId } = req.body;

    // Sanitize input
    const sanitizedData = {
      parcelId: sanitize(parcelId),
      referenceId: sanitize(referenceId),
    };

    // Check if the parcel ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(sanitizedData.parcelId)) {
      return sendErrorResponse({
        res,
        message: "Invalid parcel ID",
        errorCode: "INVALID_INPUT",
        errorDetails: "The provided parcel ID is not valid.",
        status: 400,
      });
    }

    // Check if the reference ID is start with #
    if (
      !sanitizedData.referenceId.startsWith("#") &&
      sanitizedData.referenceId.length !== 6
    ) {
      return sendErrorResponse({
        res,
        message: "Invalid reference ID",
        errorCode: "INVALID_INPUT",
        errorDetails: "The provided reference ID is not valid.",
        status: 400,
      });
    }

    // Check if the parcel exists
    const parcelExists = await Parcel.findOne({
      _id: sanitizedData.parcelId,
      userId: userId,
      referenceId: sanitizedData.referenceId,
    });
    if (!parcelExists) {
      return sendErrorResponse({
        res,
        message: "Parcel not found",
        errorCode: "NOT_FOUND",
        errorDetails:
          "The provided parcel does not exist. Please try again with a valid parcel ID and reference ID.",
        status: 404,
      });
    }

    // Check if the parcel is not already deleted
    if (parcelExists.isDeleted) {
      return sendErrorResponse({
        res,
        message: "Parcel already deleted",
        errorCode: "ALREADY_DELETED",
        errorDetails: "The provided parcel has already been deleted.",
        status: 400,
      });
    }

    // Check if the parcel is not in the reshipping process
    if (parcelExists.reshipperId && parcelExists.status !== "recived") {
      return sendErrorResponse({
        res,
        message: "Parcel in reshipping process",
        errorCode: "ALREADY_RESHIPPING",
        errorDetails:
          "The provided parcel is currently in the reshipping process. Please try again after the reshipping process is completed.",
        status: 400,
      });
    }

    // Delete the parcel
    parcelExists.isDeleted = true;
    parcelExists.deletedAt = new Date();
    await parcelExists.save();

    const parcelData = await formatParcelData(parcelExists);

    // Send response
    return sendSuccessResponse({
      res,
      message: "Parcel deleted successfully",
      data: parcelData,
      status: 200,
    });
  } catch (err) {
    console.error("Delete parcel error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: "An unexpected error occurred. Please try again later.",
      status: 500,
    });
  }
};
