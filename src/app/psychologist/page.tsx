import { requirePagePermission } from "@/lib/pageAccess";
import PsychologistPageClient from "./PsychologistPageClient";

export const dynamic = "force-dynamic";

export default async function PsychologistPage() {
  await requirePagePermission("professional:dashboard");
  return <PsychologistPageClient />;
}

