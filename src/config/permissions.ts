/**
 * This file contains the permissions and roles used in the application.
 * Each permission represents a specific action that can be performed on a resource.
 * Each role represents a group of users with specific permissions.
 * The permissions are assigned to roles based on the user's role.
 */

export const PERMISSIONS = {
  // Parcels
  CREATE_PARCEL: "create:parcel",
  READ_PARCEL: "read:parcel",
  UPDATE_PARCEL: "update:parcel",
  DELETE_PARCEL: "delete:parcel",
  ASSIGN_PARCEL: "assign:parcel",
  LIST_PARCEL: "list:parcel",
  // Addresses
  CREATE_ADDRESS: "create:address",
  LIST_ADDRESS: "read:address",
  UPDATE_ADDRESS: "update:address",
  DELETE_ADDRESS: "delete:address",
  // Adding more permissions as needed
};

export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  RESHIPPER: "reshipper",
};

const allPermissions = Object.values(PERMISSIONS);

const excludePermissions = (permissions, excludedPermissions) => {
  return permissions.filter(
    (permission) => !excludedPermissions.includes(permission)
  );
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: allPermissions,
  [ROLES.USER]: excludePermissions(allPermissions, []),
  [ROLES.RESHIPPER]: excludePermissions(allPermissions, [
    PERMISSIONS.ASSIGN_PARCEL,
  ]),
};
