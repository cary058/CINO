import { UserRole } from "@/types";

export type Permission =
  | "chat:ai"
  | "chat:request_human"
  | "volunteer:dashboard"
  | "volunteer:training"
  | "coordinator:dashboard"
  | "coordinator:assign"
  | "professional:dashboard"
  | "moderator:dashboard"
  | "moderator:actions"
  | "admin:dashboard"
  | "admin:users"
  | "admin:volunteers"
  | "admin:professionals"
  | "admin:settings"
  | "admin:kill_switch"
  | "audit:view";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: ["chat:ai", "chat:request_human"],
  VOLUNTEER: ["chat:ai", "chat:request_human", "volunteer:dashboard", "volunteer:training"],
  COORDINATOR: [
    "chat:ai",
    "chat:request_human",
    "coordinator:dashboard",
    "coordinator:assign",
    "volunteer:dashboard",
  ],
  PROFESSIONAL: [
    "chat:ai",
    "chat:request_human",
    "professional:dashboard",
  ],
  MODERATOR: [
    "chat:ai",
    "chat:request_human",
    "moderator:dashboard",
    "moderator:actions",
    "audit:view",
  ],
  ADMIN: [
    "chat:ai",
    "chat:request_human",
    "volunteer:dashboard",
    "coordinator:dashboard",
    "coordinator:assign",
    "professional:dashboard",
    "moderator:dashboard",
    "moderator:actions",
    "admin:dashboard",
    "admin:users",
    "admin:volunteers",
    "admin:professionals",
    "admin:settings",
    "audit:view",
  ],
  SUPER_ADMIN: [
    "chat:ai",
    "chat:request_human",
    "volunteer:dashboard",
    "volunteer:training",
    "coordinator:dashboard",
    "coordinator:assign",
    "professional:dashboard",
    "moderator:dashboard",
    "moderator:actions",
    "admin:dashboard",
    "admin:users",
    "admin:volunteers",
    "admin:professionals",
    "admin:settings",
    "admin:kill_switch",
    "audit:view",
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function isStaff(role: UserRole): boolean {
  return ["VOLUNTEER", "COORDINATOR", "PROFESSIONAL", "MODERATOR", "ADMIN", "SUPER_ADMIN"].includes(role);
}

export function isAdminOrSuperAdmin(role: UserRole): boolean {
  return ["ADMIN", "SUPER_ADMIN"].includes(role);
}

