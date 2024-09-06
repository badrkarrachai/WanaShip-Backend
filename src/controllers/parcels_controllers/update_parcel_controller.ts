import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/response_handler_util";
import { Response, Request } from "express";
import {
  updateParcelValidationRules,
  validateRequest,
} from "../../utils/validations_util";
import sanitize from "mongo-sanitize";
import Parcel, { STATUS } from "../../models/parcel_model";
import Address from "../../models/address_model";
import { formatParcelData } from "../../utils/responces_templates/parcel_response_template";

import { IParcel } from "../../interfaces/parcel_interface";
import { ROLES } from "../../config/permissions";
import { isValidObjectId } from "mongoose";

export const updateParcel = async (req: Request, res: Response) => {
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      updateParcelValidationRules
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

    const userId = req.user.id;
    const userRole = req.user.role;
    const { parcelId } = req.body;
    if (parcelId === undefined || !isValidObjectId(parcelId)) {
      return sendErrorResponse({
        res,
        message: "The parcel ID is required",
        errorCode: "INVALID_INPUT",
        errorDetails:
          "We couldn't process your request due to invalid parcel ID.",
        status: 400,
      });
    }

    // Find the parcel
    const parcel = await Parcel.findOne({ _id: parcelId, isDeleted: false });
    if (!parcel) {
      return sendErrorResponse({
        res,
        message: "Parcel not found",
        errorCode: "PARCEL_NOT_FOUND",
        errorDetails: "The parcel may have been deleted or doesn't exist.",
        status: 404,
      });
    }

    // Check user permissions
    if (
      userRole !== ROLES.ADMIN &&
      userId !== parcel.userId.toString() &&
      userId !== parcel.reshipperId?.toString()
    ) {
      return sendErrorResponse({
        res,
        message: "Unauthorized",
        errorCode: "UNAUTHORIZED_UPDATE",
        errorDetails:
          "Only the parcel owner, assigned reshipper, or an admin can update this parcel.",
        status: 403,
      });
    }

    const updates: Partial<IParcel> = {};

    // User updates
    if (userId === parcel.userId.toString() || userRole === ROLES.ADMIN) {
      if (parcel.status === STATUS.PENDING) {
        const {
          parcelName,
          parcelDescription,
          parcelPrice,
          parcelToAddress,
          parcelQuantity,
          parcelPurchaseDate,
          parcelTrackingNumber,
          parcelWeight,
        } = req.body;

        if (parcelName !== undefined) updates.name = sanitize(parcelName);
        if (parcelDescription !== undefined)
          updates.description = sanitize(parcelDescription);
        if (parcelPrice !== undefined) {
          const sanitizedPrice = sanitize(parcelPrice);
          if (isNaN(sanitizedPrice) || sanitizedPrice <= 0) {
            return sendErrorResponse({
              res,
              message: "Invalid price",
              errorCode: "INVALID_PRICE",
              errorDetails: "Please enter a positive number for the price.",
              status: 400,
            });
          }
          updates.price = sanitizedPrice;
        }
        if (parcelToAddress !== undefined && isValidObjectId(parcelToAddress)) {
          const addressExists = await Address.findOne({
            _id: parcelToAddress,
            userId: userId,
            isDeleted: false,
          });
          if (!addressExists) {
            return sendErrorResponse({
              res,
              message: "Address not found",
              errorCode: "ADDRESS_NOT_FOUND",
              errorDetails:
                "Please make sure you've added this address to your account.",
              status: 404,
            });
          }
          updates.toAddress = sanitize(parcelToAddress);
        } else {
          return sendErrorResponse({
            res,
            message: "Address is invalid",
            errorCode: "INVALID_ADDRESS",
            errorDetails:
              "Please make sure you've added this address to your account.",
            status: 400,
          });
        }
        if (parcelQuantity !== undefined) {
          const sanitizedQuantity = sanitize(parcelQuantity);
          if (isNaN(sanitizedQuantity) || sanitizedQuantity <= 0) {
            return sendErrorResponse({
              res,
              message: "Quantity is invalid",
              errorCode: "INVALID_QUANTITY",
              errorDetails:
                "Please enter a positive whole number for the quantity.",
              status: 400,
            });
          }
          updates.quantity = sanitizedQuantity;
        }

        if (parcelPurchaseDate !== undefined) {
          const sanitizedDate = new Date(sanitize(parcelPurchaseDate));
          if (isNaN(sanitizedDate.getTime())) {
            return sendErrorResponse({
              res,
              message: "Purchase date is invalid",
              errorCode: "INVALID_DATE",
              errorDetails: "Please enter a valid date for the purchase date.",
              status: 400,
            });
          }
          updates.purchaseDate = sanitizedDate;
        }

        if (parcelTrackingNumber !== undefined)
          updates.trackingNumber = sanitize(parcelTrackingNumber);
        if (parcelWeight !== undefined) {
          const sanitizedWeight = sanitize(parcelWeight);
          if (isNaN(sanitizedWeight) || sanitizedWeight < 0) {
            return sendErrorResponse({
              res,
              message: "Weight is invalid",
              errorCode: "INVALID_WEIGHT",
              errorDetails:
                "Please enter a positive number for the weight or 0 if you dont know.",
              status: 400,
            });
          }
          updates.weight = sanitizedWeight;
        }
      } else {
        return sendErrorResponse({
          res,
          message: "Forbidden action",
          errorCode: "UPDATE_NOT_ALLOWED",
          errorDetails:
            "Parcel details can only be updated when the status is 'pending'.",
          status: 400,
        });
      }

      if (req.body.status === STATUS.RECIVED) {
        updates.status = STATUS.RECIVED;
      }
    }

    // Reshipper updates
    if (userId === parcel.reshipperId?.toString() || userRole === ROLES.ADMIN) {
      const {
        parcelImages,
        parcelReshipperNote,
        parcelReshipperRecivedQuantity,
        parcelStatus,
        trackingNumber,
      } = req.body;

      if (
        parcel.status !== STATUS.PENDING &&
        parcel.status !== STATUS.RECIVED &&
        parcel.status !== STATUS.SENT
      ) {
        if (parcelImages !== undefined) updates.images = sanitize(parcelImages);
        if (parcelReshipperNote !== undefined)
          updates.reshipperNote = sanitize(parcelReshipperNote);
        if (parcelReshipperRecivedQuantity !== undefined) {
          const sanitizedQuantity = sanitize(parcelReshipperRecivedQuantity);
          if (isNaN(sanitizedQuantity) || sanitizedQuantity < 0) {
            return sendErrorResponse({
              res,
              message: "Received quantity is invalid",
              errorCode: "INVALID_RECEIVED_QUANTITY",
              errorDetails:
                "Please enter a non-negative whole number for the received quantity.",
              status: 400,
            });
          }
          updates.reshipperRecivedQuantity = sanitizedQuantity;
        }
      } else {
        return sendErrorResponse({
          res,
          message: "Forbidden action",
          errorCode: "UPDATE_NOT_ALLOWED",
          errorDetails:
            "These details can only be updated when the status is not 'pending', 'received', or 'sent'.",
          status: 400,
        });
      }

      if (parcelStatus !== undefined && parcelStatus !== STATUS.RECIVED) {
        updates.status = sanitize(parcelStatus);
        if (parcelStatus === STATUS.SENT) {
          updates.reshipperSendDate = new Date();
          if (trackingNumber !== undefined)
            updates.trackingNumber = sanitize(trackingNumber);
        } else if (parcel.status === STATUS.PENDING) {
          updates.reshipperRecivedDate = new Date();
        }
      } else if (parcelStatus === STATUS.RECIVED) {
        return sendErrorResponse({
          res,
          message: "Forbidden action",
          errorCode: "INVALID_STATUS_UPDATE",
          errorDetails:
            "The 'received' status can only be set by the parcel owner or an admin.",
          status: 400,
        });
      }
    }

    console.log(updates);

    // Perform the update
    const updatedParcel = await Parcel.findByIdAndUpdate(parcelId, updates, {
      new: true,
    });

    if (!updatedParcel) {
      return sendErrorResponse({
        res,
        message: "Parcel update failed",
        errorCode: "UPDATE_FAILED",
        errorDetails:
          "There was an issue updating the parcel in our system. Please try again later.",
        status: 500,
      });
    }

    const parcelData = await formatParcelData(updatedParcel);

    return sendSuccessResponse({
      res,
      message: "Parcel updated successfully",
      data: parcelData,
      status: 200,
    });
  } catch (err) {
    console.error("Update parcel error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails:
        "We're experiencing technical difficulties. Please try again later or contact support if the problem persists.",
      status: 500,
    });
  }
};
