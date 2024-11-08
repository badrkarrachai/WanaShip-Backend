import { IParcel } from "../../interfaces/parcel_interface";
import { IAddress } from "../../interfaces/address_interface";
import { IUser } from "../../interfaces/user_interface";
import { formatImageData } from "./image_response_template";
import { formatAddressData } from "./address_response_template";

/**
 * Utility function to format parcel data for responses.
 *
 * @param parcel - The parcel object from the database.
 * @returns The formatted parcel data object.
 */
export async function formatParcelData(
  parcel: IParcel
): Promise<Record<string, any>> {
  let formattedAddress: Record<string, any> | null = null;
  let formattedUser: Record<string, any> | null = null;
  let formattedReshipper: Record<string, any> | null = null;

  // Populate necessary fields
  await parcel.populate(["toAddress", "userId", "reshipperId"]);

  // Prepare address
  if (parcel.toAddress) {
    const address = parcel.toAddress as IAddress;
    formattedAddress = formatAddressData(address);
  }

  // Prepare user for parcel
  if (parcel.userId) {
    const user = parcel.userId as IUser;
    await user.populate("avatar");
    const userAvatar = user.avatar ? formatImageData(user.avatar) : null;
    formattedUser = {
      id: user.id,
      name: user.name,
      avatar: userAvatar,
      awayDateStart: user.awayDateStart,
      awayDateEnd: user.awayDateEnd,
      isActivated: user.isActivated,
      isDeleted: user.isDeleted,
    };
  }

  // Prepare reshipper for parcel
  if (parcel.reshipperId) {
    const reshipperUser = parcel.reshipperId as IUser;
    await reshipperUser.populate("avatar");
    const reshipperAvatar = reshipperUser.avatar
      ? formatImageData(reshipperUser.avatar)
      : null;
    formattedReshipper = {
      id: reshipperUser.id,
      name: reshipperUser.name,
      avatar: reshipperAvatar,
      awayDateStart: reshipperUser.awayDateStart,
      awayDateEnd: reshipperUser.awayDateEnd,
      isActivated: reshipperUser.isActivated,
      isDeleted: reshipperUser.isDeleted,
    };
  }

  // Construct and return the formatted response
  return {
    id: parcel.id,
    name: parcel.name,
    description: parcel.description,
    price: parcel.price,
    images: parcel.images,
    quantity: parcel.quantity,
    purchaseDate: parcel.purchaseDate,
    reshipperRecivedQuantity: parcel.reshipperRecivedQuantity,
    status: parcel.status,
    weight: parcel.weight,
    trackingNumber: parcel.trackingNumber,
    referenceId: parcel.referenceId,
    toAddress: formattedAddress,
    user: formattedUser,
    reshipper: formattedReshipper,
    isActive: parcel.isActive,
    isDeleted: parcel.isDeleted,
    deletedAt: parcel.deletedAt,
    createdAt: parcel.createdAt,
    updatedAt: parcel.updatedAt,
  };
}
