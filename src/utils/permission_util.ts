import { ROLE_PERMISSIONS } from "../config/permissions";

export function hasPermission(
  userRole: string,
  requiredPermission: string
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(requiredPermission);
}
