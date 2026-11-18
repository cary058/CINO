import { requirePagePermission } from "@/lib/pageAccess";
import CoordinatorPageClient from "./CoordinatorPageClient";

export const dynamic = "force-dynamic";

export default async function CoordinatorPage() {
  await requirePagePermission("coordinator:dashboard");
  return <CoordinatorPageClient />;
}

