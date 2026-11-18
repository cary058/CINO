import { requirePagePermission } from "@/lib/pageAccess";
import VolunteerPageClient from "./VolunteerPageClient";

export const dynamic = "force-dynamic";

export default async function VolunteerPage() {
  await requirePagePermission("volunteer:dashboard");
  return <VolunteerPageClient />;
}

