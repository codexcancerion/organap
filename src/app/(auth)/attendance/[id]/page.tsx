import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getEventAttendanceRoster } from "@/features/attendance/services/attendance_queries";
import { AttendanceConsole } from "@/features/attendance/components/attendance_console";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await getEventAttendanceRoster(id);

  return {
    title: data.event ? `Attendance Desk: ${data.event.title} | OrGanap` : "Attendance Desk",
  };
}

export default async function AttendanceDeskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const { event, roster } = await getEventAttendanceRoster(id);

  if (!event) {
    notFound();
  }

  return <AttendanceConsole event={event} roster={roster} />;
}
