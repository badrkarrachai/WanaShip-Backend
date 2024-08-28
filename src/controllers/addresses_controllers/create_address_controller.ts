import { AuthRequest } from "../../interfaces/auth_request_interface";
import { Response } from "express";
import {
  addAddressValidationRules,
  validateRequest,
} from "../../utils/validations_util";
import {
  sendErrorResponse,
  sendSuccessResponse,
} from "../../utils/response_handler_util";
import sanitize from "mongo-sanitize";
import Address from "../../models/address_model";
import { formatAddressData } from "../../utils/responces_templates/address_response_template";

export const createAddress = async (req: AuthRequest, res: Response) => {
  try {
    // Validation
    const validationErrors = await validateRequest(
      req,
      res,
      addAddressValidationRules
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
      country,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
      countryCode,
      phoneNumber,
    } = req.body;

    // Sanitize each input
    const sanitizedData = {
      country: sanitize(country),
      addressLine1: sanitize(addressLine1),
      addressLine2: sanitize(addressLine2),
      city: sanitize(city),
      state: sanitize(state),
      zip: sanitize(zip),
      countryCode: sanitize(countryCode),
      phoneNumber: sanitize(phoneNumber),
    };

    // Check if this address already exists
    const addressExists = await Address.findOne({
      userId,
      ...sanitizedData,
    });
    if (addressExists) {
      return sendErrorResponse({
        res,
        message: "Address already exists",
        errorCode: "INVALID_INPUT",
        errorDetails:
          "This address already exists, try adding a different address.",
        status: 400,
      });
    }

    // Create the address
    const address = new Address({
      userId,
      ...sanitizedData,
      isDeleted: false,
    });

    await address.save();

    const addressData = formatAddressData(address);
    // Send response
    return sendSuccessResponse({
      res,
      message: "Address created successfully",
      data: {
        addressData,
      },
      status: 201,
    });
  } catch (err) {
    console.error("Create address error:", err);
    return sendErrorResponse({
      res: res,
      message: "Server error",
      errorCode: "INTERNAL_SERVER_ERROR",
      errorDetails: "An unexpected error occurred. Please try again later.",
      status: 500,
    });
  }
};
