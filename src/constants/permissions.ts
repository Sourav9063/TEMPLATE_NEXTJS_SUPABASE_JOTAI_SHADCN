export const PERMISSIONS = {
  Admin: "admin",
  Reviewer: "reviewer",
  User: "user",
} as const;

export const PERMISSIONS_LIST = Object.values(PERMISSIONS);

export type PermissionValues = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Ordered lowest → highest privilege — insert new levels here when added
export const PERMISSION_HIERARCHY: PermissionValues[] = [
  PERMISSIONS.User,
  PERMISSIONS.Reviewer,
  PERMISSIONS.Admin,
];

export function getPermisson(userPermissions: string[]) {
  const result: Record<string, boolean> = {};

  Object.values(PERMISSIONS).forEach((val) => {
    result[val] = userPermissions.includes(val);
  });

  return result as Record<PermissionValues, boolean>;
}
