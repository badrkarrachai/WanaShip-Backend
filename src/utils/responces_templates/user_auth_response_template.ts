import { IUser } from "../../interfaces/user_interface";
import { formatImageData } from "./image_response_template";

/**
 * Utility function to format user data for responses.
 *
 * @param user - The user object from the database.
 * @param messagesForUser - Optional messages to include in the response.
 * @returns The formatted user data object.
 */
export function formatUserData(
  user: IUser,
  messagesForUser: string[] = []
): Record<string, any> {
  const userAvatar = user.avatar ? formatImageData(user.avatar) : null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: userAvatar,
    addresses: user.addresses,
    isActivated: user.isActivated,
    preferences: user.preferences,
    notificationSettings: user.notificationSettings,
    awayDateStart: user.awayDateStart,
    awayDateEnd: user.awayDateEnd,
    socialMedia: user.socialMedia,
    isDeleted: user.isDeleted,
    deletedAt: user.deletedAt,
    twoFactorEnabled: user.twoFactorEnabled,
    authProvider: user.authProvider,
    messages: messagesForUser,
  };
}
