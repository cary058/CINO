import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Permission, hasPermission } from "@/lib/rbac";

export async function requirePagePermission(permission: Permission) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasPermission(user.role, permission)) redirect("/");
}

