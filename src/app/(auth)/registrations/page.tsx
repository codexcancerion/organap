import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getStudentRegistrations } from "@/features/registrations/services/registration_queries";
import { StudentRegistrationsList } from "@/features/registrations/components/student_registrations_list";

export const metadata: Metadata = {
  title: "My Event Passes | OrGanap",
  description: "View and present your registered event tickets and QR entry codes.",
};

export default async function RegistrationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const passes = await getStudentRegistrations(user.id);

  return (
    <StudentRegistrationsList
      passes={passes}
      schoolId={user.schoolId ?? "2026-STUDENT"}
      studentName={user.displayName ?? user.email.split("@")[0]}
    />
  );
}
