import { hash, compare } from "bcrypt";
import type { UserRoleType } from "../db/schema";

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 10);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return compare(password, hash);
};

export const RoleHierarchy: Record<UserRoleType, number> = {
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
};

export const hasRole = (userRole: UserRoleType, requiredRole: UserRoleType): boolean => {
  return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
};

export const isOwnerOrHigher = (userRole: UserRoleType, isOwner: boolean): boolean => {
  return isOwner || hasRole(userRole, "MODERATOR");
};
