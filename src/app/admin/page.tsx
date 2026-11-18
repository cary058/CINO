import { requirePagePermission } from "@/lib/pageAccess";
import AdminPageClient from "./AdminPageClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requirePagePermission("admin:dashboard");
  return <AdminPageClient />;
}

