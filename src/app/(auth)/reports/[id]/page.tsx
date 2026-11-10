import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getEventReportDetail } from "@/features/reports/services/report_queries";
import { AttendanceReportView } from "@/features/reports/components/attendance_report_view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const report = await getEventReportDetail(id);

  return {
    title: report ? `Report: ${report.summary.eventTitle} | OrGanap` : "Event Report",
  };
}

export default async function EventReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const report = await getEventReportDetail(id);

  if (!report) {
    notFound();
  }

  return <AttendanceReportView report={report} />;
}
