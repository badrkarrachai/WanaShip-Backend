import { IUser } from "../interfaces/user_interface";

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
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar
      ? {
          id: user.avatar.id,
          name: user.avatar.name,
          url: user.avatar.url,
          isDeleted: user.avatar.isDeleted,
          deletedAt: user.avatar.deletedAt,
          createdAt: user.avatar.createdAt,
          updatedAt: user.avatar.updatedAt,
        }
      : null,
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
