import { IAddress } from "../../interfaces/address_interface";
import { IUser } from "../../interfaces/user_interface";
import { formatImageData } from "./image_response_template";

/**
 * Utility function to format address data for responses.
 *
 * @param address - The address object from the database.
 * @returns The formatted address data object.
 */
export function formatAddressData(address: IAddress): Record<string, any> {
  return {
    id: address.id,
    userId: address.userId,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
    countryCode: address.countryCode,
    phoneNumber: address.phoneNumber,
    isDeleted: address.isDeleted,
    deletedAt: address.deletedAt,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}
