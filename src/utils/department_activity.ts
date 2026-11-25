// Shared server-side aggregation helper for department-mapped organization,
// event, registration, and attendance KPIs used by both Departments and Programs.
import type {
  DepartmentActivityMetrics,
  DepartmentEventSummary,
  DepartmentOrganizationSummary,
} from "@/types/domain";

import { createClient } from "@/utils/supabase/server";

export type DepartmentActivityBundle = {
  metrics: DepartmentActivityMetrics;
  organizations: DepartmentOrganizationSummary[];
  recentEvents: DepartmentEventSummary[];
};

export const EMPTY_DEPARTMENT_METRICS: DepartmentActivityMetrics = {
  organizationsCount: 0,
  eventsCount: 0,
  totalProposalsCount: 0,
  registrationsCount: 0,
  attendancesCount: 0,
  attendanceRate: 0,
};

type OrgRow = {
  id: string;
  name: string;
  acronym: string;
  slug: string;
  category: string;
  logo_url: string | null;
  department_id: string | null;
};

type ProposalRow = {
  id: string;
  title: string;
  organization_id: string;
  status: string;
  start_time: string;
  venues: { name: string } | null;
};

type RegistrationRow = {
  proposal_id: string;
  status: string;
};

type AttendanceRow = {
  proposal_id: string;
};

/**
 * Computes event and participation KPIs for academic departments by joining
 * organizations mapped via `organizations.department_id` to their proposals,
 * active student registrations, and verified attendance check-ins.
 */
export async function getDepartmentActivityMap(
  departmentIds?: string[],
): Promise<Map<string, DepartmentActivityBundle>> {
  const result = new Map<string, DepartmentActivityBundle>();
  const supabase = await createClient();

  let orgQuery = supabase
    .from("organizations")
    .select("id, name, acronym, slug, category, logo_url, department_id")
    .not("department_id", "is", null)
    .order("name", { ascending: true });

  if (departmentIds && departmentIds.length > 0) {
    orgQuery = orgQuery.in("department_id", departmentIds);
  }

  const { data: orgData, error: orgError } = await orgQuery;

  if (orgError || !orgData || orgData.length === 0) {
    return result;
  }

  const orgs = orgData as unknown as OrgRow[];
  const orgById = new Map<string, OrgRow>();
  const orgsByDept = new Map<string, DepartmentOrganizationSummary[]>();

  for (const org of orgs) {
    if (!org.department_id) continue;
    orgById.set(org.id, org);
    const list = orgsByDept.get(org.department_id) ?? [];

    list.push({
      id: org.id,
      name: org.name,
      acronym: org.acronym,
      slug: org.slug,
      category: org.category,
      logoUrl: org.logo_url,
    });
    orgsByDept.set(org.department_id, list);
  }

  const orgIds = Array.from(orgById.keys());

  const { data: proposalData } = await supabase
    .from("event_proposals")
    .select("id, title, organization_id, status, start_time, venues:venue_id (name)")
    .in("organization_id", orgIds)
    .order("start_time", { ascending: false });

  const proposals = (proposalData ?? []) as unknown as ProposalRow[];
  const proposalIds = proposals.map((p) => p.id);

  const regCountsByProposal = new Map<string, number>();
  const attCountsByProposal = new Map<string, number>();

  if (proposalIds.length > 0) {
    const [regsRes, attsRes] = await Promise.all([
      supabase
        .from("event_registrations")
        .select("proposal_id, status")
        .in("proposal_id", proposalIds)
        .neq("status", "withdrawn"),
      supabase
        .from("attendance_records")
        .select("proposal_id")
        .in("proposal_id", proposalIds),
    ]);

    for (const r of (regsRes.data ?? []) as unknown as RegistrationRow[]) {
      regCountsByProposal.set(
        r.proposal_id,
        (regCountsByProposal.get(r.proposal_id) ?? 0) + 1,
      );
    }

    for (const a of (attsRes.data ?? []) as unknown as AttendanceRow[]) {
      attCountsByProposal.set(
        a.proposal_id,
        (attCountsByProposal.get(a.proposal_id) ?? 0) + 1,
      );
    }
  }

  const eventsByDept = new Map<string, DepartmentEventSummary[]>();
  const metricsByDept = new Map<string, DepartmentActivityMetrics>();

  for (const [deptId, deptOrgs] of orgsByDept.entries()) {
    metricsByDept.set(deptId, {
      organizationsCount: deptOrgs.length,
      eventsCount: 0,
      totalProposalsCount: 0,
      registrationsCount: 0,
      attendancesCount: 0,
      attendanceRate: 0,
    });
    eventsByDept.set(deptId, []);
  }

  for (const p of proposals) {
    const org = orgById.get(p.organization_id);

    if (!org?.department_id) continue;

    const deptId = org.department_id;
    const m = metricsByDept.get(deptId);

    if (!m) continue;

    const regs = regCountsByProposal.get(p.id) ?? 0;
    const atts = attCountsByProposal.get(p.id) ?? 0;

    m.totalProposalsCount += 1;
    if (p.status === "approved") {
      m.eventsCount += 1;
    }
    m.registrationsCount += regs;
    m.attendancesCount += atts;

    eventsByDept.get(deptId)?.push({
      id: p.id,
      title: p.title,
      organizationAcronym: org.acronym,
      venueName: p.venues?.name ?? "Campus Venue",
      startTime: p.start_time,
      status: p.status,
      registrationsCount: regs,
      attendancesCount: atts,
    });
  }

  for (const [deptId, m] of metricsByDept.entries()) {
    m.attendanceRate =
      m.registrationsCount > 0
        ? Math.round((m.attendancesCount / m.registrationsCount) * 100)
        : 0;

    result.set(deptId, {
      metrics: m,
      organizations: orgsByDept.get(deptId) ?? [],
      recentEvents: eventsByDept.get(deptId) ?? [],
    });
  }

  return result;
}
