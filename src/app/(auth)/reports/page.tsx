import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getAttendanceReportsList } from "@/features/reports/services/report_queries";
import { ReportsList } from "@/features/reports/components/reports_list";
import { PageHeader } from "@/components/layout/page_header";

export const metadata: Metadata = {
  title: "Participation & Attendance Reports | OrGanap",
  description: "Institutional event turnout metrics and RFC 4180 compliant CSV audit export.",
};

export default async function ReportsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const reports = await getAttendanceReportsList(user.id);

  return (
    <div className="flex flex-col gap-6 w-full">
      <PageHeader
        description="Review institutional turnout metrics, capacity utilization, and export attendance audits to RFC 4180 CSV."
        title="Event Participation Reports"
      />
      <ReportsList reports={reports} />
    </div>
  );
}
