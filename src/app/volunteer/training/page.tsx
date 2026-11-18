import { requirePagePermission } from "@/lib/pageAccess";
import VolunteerTrainingPageClient from "./VolunteerTrainingPageClient";

export const dynamic = "force-dynamic";

export default async function VolunteerTrainingPage() {
  await requirePagePermission("volunteer:training");
  return <VolunteerTrainingPageClient />;
}

