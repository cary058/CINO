import { redirect } from "next/navigation";
import VolunteerApplyPageClient from "./VolunteerApplyPageClient";

export default function VolunteerApplyPage() {
  if (process.env.NODE_ENV === "production" && process.env.DEMO_MODE === "true") {
    redirect("/");
  }

  return <VolunteerApplyPageClient />;
}

