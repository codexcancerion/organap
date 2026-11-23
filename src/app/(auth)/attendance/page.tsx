import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getAttendanceEligibleEvents } from "@/features/attendance/services/attendance_queries";
import { AttendanceEventPicker } from "@/features/attendance/components/attendance_event_picker";
import { PageHeader } from "@/components/layout/page_header";

export const metadata: Metadata = {
  title: "Attendance Desk | OrGanap",
  description: "Verify student tickets, scan dynamic QR passes, and record live event attendance.",
};

export default async function AttendancePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canManageAttendance =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("attendance.verify") ||
    user.permissions.includes("attendance.view") ||
    user.permissions.includes("reports.view") ||
    user.permissions.includes("reports.export");

  if (!canManageAttendance) {
    redirect("/events");
  }

  const events = await getAttendanceEligibleEvents({
    id: user.id,
    isStaff: user.isStaff,
    isSuperuser: user.isSuperuser,
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        description="Manage live check-in sessions, scan digital QR passes, and oversee event participation."
        title="Attendance Desk"
      />
      <AttendanceEventPicker events={events} />
    </div>
  );
}
