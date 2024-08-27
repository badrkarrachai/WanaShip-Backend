import { AuthRequest } from "../../interfaces/auth_request_interface";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/response_handler_util";
import { Response } from "express";
import {
  addParcelValidationRules,
  validateRequest,
} from "../../utils/validations_util";
import sanitize from "mongo-sanitize";
import Parcel from "../../models/parcel_model";
import { generateReferenceId } from "../../utils/reference_id_generator_util";
import mongoose from "mongoose";
import Address from "../../models/address_model";

export const createParcel = async (req: AuthRequest, res: Response) => {
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      addParcelValidationRules
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
    const {
      parcelName,
      parcelDescription,
      parcelQuantity,
      parcelPrice,
      parcelPurchaseDate,
      toAddress,
    } = req.body;

    // Sanitize input
    const sanitizedData = {
      parcelName: sanitize(parcelName),
      parcelDescription: sanitize(parcelDescription),
      parcelQuantity: sanitize(parcelQuantity),
      parcelPrice: sanitize(parcelPrice),
      parcelPurchaseDate: sanitize(parcelPurchaseDate),
      toAddress: sanitize(toAddress),
    };

    // Additional input validation
    if (
      typeof sanitizedData.parcelPrice !== "number" ||
      sanitizedData.parcelPrice <= 0
    ) {
      return sendErrorResponse({
        res,
        message: "Invalid price",
        errorCode: "INVALID_INPUT",
        errorDetails: "Price must be a positive number.",
        status: 400,
      });
    }

    // Check if the purchase date is valid
    if (
      isNaN(new Date(sanitizedData.parcelPurchaseDate).getTime()) ||
      new Date(sanitizedData.parcelPurchaseDate) > new Date()
    ) {
      return sendErrorResponse({
        res,
        message: "Invalid purchase date",
        errorCode: "INVALID_INPUT",
        errorDetails:
          "Purchase date must be a valid date and cannot be in the future.",
        status: 400,
      });
    }

    // Check if the parcel quantity is a valid number
    if (
      isNaN(sanitizedData.parcelQuantity) ||
      sanitizedData.parcelQuantity <= 0
    ) {
      return sendErrorResponse({
        res,
        message: "Invalid parcel quantity",
        errorCode: "INVALID_INPUT",
        errorDetails: "Parcel quantity must be a valid number.",
        status: 400,
      });
    }

    // Check if the toAddress is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(sanitizedData.toAddress)) {
      return sendErrorResponse({
        res,
        message: "Invalid address",
        errorCode: "INVALID_INPUT",
        errorDetails: "The provided address ID is not valid.",
        status: 400,
      });
    }

    // Check if the address exists in the Address collection under the user
    const addressExists = await Address.findOne({
      _id: sanitizedData.toAddress,
      userId: userId, // Ensure the address belongs to the user
      isDeleted: false, // Ensure the address is not deleted
    });
    if (!addressExists) {
      return sendErrorResponse({
        res,
        message: "Address not found",
        errorCode: "NOT_FOUND",
        errorDetails:
          "The provided address does not exist. Please add a new address to your account first.",
        status: 404,
      });
    }

    // Generate a unique reference ID
    const referenceId = generateReferenceId();

    // Create the parcel
    const parcel = new Parcel({
      userId,
      name: sanitizedData.parcelName,
      description: sanitizedData.parcelDescription,
      quantity: sanitizedData.parcelQuantity,
      price: sanitizedData.parcelPrice,
      purchaseDate: new Date(sanitizedData.parcelPurchaseDate),
      toAddress: sanitizedData.toAddress, // Ensure this is included
      referenceId: referenceId,
      status: "pending",
      isActive: true,
      isDeleted: false,
    });

    await parcel.save();

    // Send response
    return sendSuccessResponse({
      res,
      message: "Parcel created successfully",
      data: {
        id: parcel._id,
        name: parcel.name,
        description: parcel.description,
        price: parcel.price,
        purchaseDate: parcel.purchaseDate,
        referenceId: parcel.referenceId,
        status: parcel.status,
      },
      status: 201,
    });
  } catch (err) {
    console.error("Create parcel error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: "An unexpected error occurred. Please try again later.",
      status: 500,
    });
  }
};