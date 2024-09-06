import { body, ValidationChain, validationResult } from "express-validator";
import { sendErrorResponse } from "./response_handler_util";
import { Request, Response } from "express";
import { STATUS } from "../models/parcel_model";

// Common validation rules
const validationRules = {
  name: body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters long"),
  email: body("email")
    .trim()
    .isEmail()
    .withMessage("Please include a valid email")
    .isLength({ max: 250 })
    .withMessage("Email must not exceed 250 characters"),
  password: body("password")
    .exists()
    .withMessage("Password is required")
    .isLength({ min: 6, max: 250 })
    .withMessage("Password must be 6-250 characters long"),
  confirmPassword: body("confirmPassword")
    .exists()
    .withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),
  otp: body("otp", "OTP is required")
    .exists()
    .isString()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 characters long"),
  currentPassword: body("currentPassword")
    .exists()
    .withMessage("Current password is required")
    .isLength({ min: 6, max: 250 })
    .withMessage("Current password must be 6-250 characters long"),
  newPassword: body("newPassword")
    .exists()
    .withMessage("New password is required")
    .isLength({ min: 6, max: 250 })
    .withMessage("New password must be 6-250 characters long"),
  newPasswordConfirm: body("confirmNewPassword")
    .exists()
    .withMessage("Confirm new password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("New passwords do not match");
      }
      return true;
    }),
  currentEmail: body("currentEmail")
    .trim()
    .isEmail()
    .withMessage("Please include a valid current email")
    .isLength({ max: 250 })
    .withMessage("Current email must not exceed 250 characters"),
  reasons: body("reasons")
    .exists()
    .withMessage("Reasons are required")
    .isArray()
    .withMessage("Reasons must be an array"),

  parcelName: body("parcelName")
    .exists()
    .withMessage("Parcel name is required")
    .isString()
    .withMessage("Parcel name must be a string")
    .isLength({ min: 3, max: 50 })
    .withMessage("Parcel name must be 3-50 characters long"),
  parcelDescription: body("parcelDescription")
    .exists()
    .withMessage("Parcel description is required")
    .isLength({ max: 500 })
    .withMessage("Parcel description must not exceed 500 characters"),
  parcelQuantity: body("parcelQuantity")
    .exists()
    .withMessage("Parcel quantity is required")
    .isInt({ min: 1 })
    .withMessage("Parcel quantity must be a number and at least 1"),
  parcelTrackingNumber: body("parcelTrackingNumber")
    .exists()
    .withMessage("Tracking number is required")
    .isString()
    .withMessage("Tracking number must be a string"),
  parcelWeight: body("parcelWeight")
    .exists()
    .withMessage("Weight is required")
    .isFloat({ min: 0 })
    .withMessage("Weight must be a non-negative number"),
  parcelPrice: body("parcelPrice")
    .exists()
    .withMessage("Parcel price is required")
    .isNumeric()
    .withMessage("Parcel price must be a number"),
  parcelPurchaseDate: body("parcelPurchaseDate")
    .exists()
    .withMessage("Parcel purchase date is required")
    .isDate()
    .withMessage("Parcel purchase date must be a date"),
  parcelToAddress: body("parcelToAddress")
    .exists()
    .withMessage("To address is required")
    .isString()
    .withMessage("To address must be a string"),
  country: body("country")
    .exists()
    .withMessage("Country is required")
    .isString()
    .withMessage("Country must be a string"),
  addressLine1: body("addressLine1")
    .exists()
    .withMessage("Address line 1 is required")
    .isString()
    .withMessage("Address line 1 must be a string")
    .isLength({ min: 2, max: 250 })
    .withMessage("Address line 1 must be 2-250 characters long"),
  addressLine2: body("addressLine2")
    .exists()
    .withMessage("Address line 2 is required")
    .isString()
    .withMessage("Address line 2 must be a string")
    .isLength({ max: 250 })
    .withMessage("Address line 2 must not exceed 250 characters"),
  city: body("city")
    .exists()
    .withMessage("City is required")
    .isString()
    .withMessage("City must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be 2-50 characters long"),
  state: body("state")
    .exists()
    .withMessage("State is required")
    .isString()
    .withMessage("State must be a string")
    .isLength({ min: 2, max: 100 })
    .withMessage("State must be 2-100 characters long"),
  zip: body("zip")
    .exists()
    .withMessage("Zip is required")
    .isString()
    .withMessage("Zip must be a string")
    .isLength({ min: 1, max: 50 })
    .withMessage("Zip must be 1-50 characters long"),
  countryCode: body("countryCode")
    .exists()
    .withMessage("Country code is required")
    .isString()
    .withMessage("Country code must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Country code must be 2-50 characters long"),
  phoneNumber: body("phoneNumber")
    .exists()
    .withMessage("Phone number is required")
    .isString()
    .withMessage("Phone number must be a string")
    .isLength({ min: 2, max: 50 })
    .withMessage("Phone number must be 2-50 characters long"),
  parcelId: body("parcelId")
    .exists()
    .withMessage("Parcel ID is required")
    .isString()
    .withMessage("Parcel ID must be a string")
    .isLength({ min: 1, max: 250 })
    .withMessage("Parcel ID must be 1-250 characters long"),
  referenceId: body("referenceId")
    .exists()
    .withMessage("Reference ID is required")
    .isString()
    .withMessage("Reference ID must be a string")
    .isLength({ min: 1, max: 250 })
    .withMessage("Reference ID must be 1-250 characters long"),
  parcelImages: body("parcelImages")
    .isArray({ max: 10 })
    .withMessage("Parcel images must be an array with a maximum of 10 items"),
  parcelReshipperNote: body("parcelReshipperNote")
    .isString()
    .withMessage("Parcel reshipper note must be a string")
    .isLength({ max: 500 })
    .withMessage("Parcel reshipper note must not exceed 500 characters"),
  parcelReshipperRecivedQuantity: body("parcelReshipperRecivedQuantity")
    .exists()
    .withMessage("Parcel reshipper recived quantity is required")
    .isInt({ min: 1 })
    .withMessage(
      "Parcel reshipper recived quantity must be a number and at least 1"
    ),
  parcelStatus: body("parcelStatus")
    .exists()
    .withMessage("Parcel status is required")
    .isIn(Object.values(STATUS)) // Validate that it's one of the predefined statuses
    .withMessage(
      `Parcel status must be one of the following: ${Object.values(STATUS).join(
        ", "
      )}`
    ),
};

// Validation rule sets for specific routes
export const registrationValidationRules = [
  validationRules.name,
  validationRules.email,
  validationRules.password,
  validationRules.confirmPassword,
];
// Login validation rules
export const loginValidationRules = [
  validationRules.email,
  validationRules.password,
];
// Request password reset validation rules
export const requestPasswordResetValidationRules = [validationRules.email];
// Reset password validation rules
export const resetPasswordValidationRules = [
  validationRules.email,
  validationRules.otp,
  validationRules.newPassword,
  validationRules.newPasswordConfirm,
];
// Verify OTP validation rules
export const verifyOtpValidationRules = [
  validationRules.otp,
  validationRules.email,
];
// Request update profile email validation rules
export const updateProfileEmailValidationRules = [
  validationRules.email,
  validationRules.currentEmail,
  validationRules.currentPassword,
];
// Update profile email via OTP validation rules
export const updateProfileEmailViaOTPValidationRules = [
  validationRules.email,
  validationRules.currentEmail,
  validationRules.otp,
];
// Update profile name validation rules
export const updateProfileNameValidationRules = [
  validationRules.email,
  validationRules.name,
];
// Update profile password validation rules
export const updateProfilePasswordValidationRules = [
  validationRules.email,
  validationRules.currentPassword,
  validationRules.newPassword,
  validationRules.newPasswordConfirm,
];
// Delete account validation rules
export const requesteleteAccountValidationRules = [validationRules.reasons];
// Request Verify email validation rules
export const requestverifyEmailValidationRules = [validationRules.email];
// verify email validation rules
export const verifyEmailValidationRules = [
  validationRules.email,
  validationRules.otp,
];
// Parcel validation rules
export const addParcelValidationRules = [
  validationRules.parcelName,
  validationRules.parcelDescription,
  validationRules.parcelQuantity,
  validationRules.parcelTrackingNumber,
  validationRules.parcelWeight,
  validationRules.parcelToAddress,
  validationRules.parcelPrice,
  validationRules.parcelPurchaseDate,
];
export const deleteParcelValidationRules = [
  validationRules.parcelId,
  validationRules.referenceId,
];
// Address validation rules
export const addAddressValidationRules = [
  validationRules.country,
  validationRules.addressLine1,
  validationRules.addressLine2,
  validationRules.city,
  validationRules.state,
  validationRules.zip,
  validationRules.countryCode,
  validationRules.phoneNumber,
];

// Update parcel validation rules
export const updateParcelValidationRules = [
  validationRules.parcelId,
  validationRules.parcelName,
  validationRules.parcelDescription,
  validationRules.parcelPrice,
  validationRules.parcelToAddress,
  validationRules.parcelQuantity,
  validationRules.parcelPurchaseDate,
  validationRules.parcelTrackingNumber,
  validationRules.parcelWeight,
  validationRules.parcelImages,
  validationRules.parcelReshipperNote,
  validationRules.parcelReshipperRecivedQuantity,
  validationRules.parcelStatus,
];

// Call method to validate
export const validateRequest = async (
  req: Request,
  res: Response,
  validationRules: ValidationChain[]
) => {
  await Promise.all(validationRules.map((validation) => validation.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errors.array()[0].msg;
  }
  return "validation successful";
};
