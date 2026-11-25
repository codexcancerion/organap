"use client";

// Dynamic permission-governed operational dashboard for OrGanap (FR-18).
import type { AuthUser } from "@/types";
import type { DashboardMetrics } from "../types";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Chip, EmptyState } from "@heroui/react";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  FilePlus,
  FileText,
  Inbox,
  MapPin,
  ShieldCheck,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/layout/page_header";
import { ProposalStatusChip } from "@/components/ui/proposal_status_chip";

type KpiTone = "danger" | "accent" | "warning" | "success" | "neutral";

type DashboardKpi = {
  title: string;
  value: string;
  subtitle: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: KpiTone;
  badgeText?: string;
  progressPercent?: number;
};

const KPI_TONE_STYLES: Record<
  KpiTone,
  { bar: string; iconBox: string; chipColor: "danger" | "accent" | "warning" | "success" | "default"; progress: string }
> = {
  danger: {
    bar: "bg-danger/70",
    iconBox: "bg-danger/10 text-danger",
    chipColor: "danger",
    progress: "bg-danger",
  },
  accent: {
    bar: "bg-accent/70",
    iconBox: "bg-accent/10 text-accent",
    chipColor: "accent",
    progress: "bg-accent",
  },
  warning: {
    bar: "bg-warning/70",
    iconBox: "bg-warning/10 text-warning",
    chipColor: "warning",
    progress: "bg-warning",
  },
  success: {
    bar: "bg-success/70",
    iconBox: "bg-success/10 text-success",
    chipColor: "success",
    progress: "bg-success",
  },
  neutral: {
    bar: "bg-border/70",
    iconBox: "bg-default/20 text-muted",
    chipColor: "default",
    progress: "bg-accent",
  },
};

export function EmptyDashboard({
  user,
  metrics,
}: {
  user: AuthUser;
  metrics?: DashboardMetrics;
}) {
  const displayName = user.displayName || user.email.split("@")[0];

  const hasPerm = (code: string) => user.isSuperuser || user.permissions.includes(code);

  const canCreateProposals = hasPerm("proposals.create");
  const canEndorseProposals = hasPerm("proposals.endorse");
  const canApproveProposals = hasPerm("proposals.approve") || user.isStaff;
  const canRegisterEvents = hasPerm("events.register");
  const canManageAttendance =
    user.isSuperuser ||
    user.isStaff ||
    hasPerm("attendance.verify") ||
    hasPerm("attendance.view");

  const totalRegs = metrics?.totalRegistrations ?? 0;
  const totalAttended = metrics?.totalAttended ?? 0;
  const turnoutRate =
    totalRegs > 0 ? Math.min(100, Math.round((totalAttended / totalRegs) * 100)) : null;

  // Role-adapted 4 KPI cards (FR-18)
  const kpis: DashboardKpi[] = canApproveProposals
    ? [
        {
          title: "Pending Approvals",
          value: String(metrics?.pendingApprovals ?? 0),
          subtitle: "Awaiting final review",
          href: "/events",
          icon: Inbox,
          tone: "danger",
          badgeText: (metrics?.pendingApprovals ?? 0) > 0 ? "Action needed" : undefined,
        },
        {
          title: "Active Events",
          value: String(metrics?.activeEvents ?? 0),
          subtitle: "Scheduled on campus",
          href: "/events",
          icon: CheckCircle2,
          tone: "accent",
        },
        {
          title: "Total Registrations",
          value: String(totalRegs),
          subtitle: "Confirmed across campus",
          href: "/events",
          icon: Ticket,
          tone: "warning",
        },
        {
          title: "Recorded Attendees",
          value: String(totalAttended),
          subtitle: "Verified check-ins",
          href: "/attendance",
          icon: UserCheck,
          tone: "success",
          badgeText: turnoutRate !== null ? `${turnoutRate}% turnout` : undefined,
          progressPercent: turnoutRate ?? undefined,
        },
      ]
    : canEndorseProposals
      ? [
          {
            title: "Awaiting Endorsement",
            value: String(metrics?.awaitingEndorsement ?? 0),
            subtitle: "Assigned organizations",
            href: "/events",
            icon: Clock,
            tone: "warning",
            badgeText: (metrics?.awaitingEndorsement ?? 0) > 0 ? "Action needed" : undefined,
          },
          {
            title: "Active Events",
            value: String(metrics?.activeEvents ?? 0),
            subtitle: "Scheduled on campus",
            href: "/events",
            icon: CheckCircle2,
            tone: "accent",
          },
          {
            title: "Recognized Orgs",
            value: String(metrics?.recognizedOrgs ?? 0),
            subtitle: "Student organizations",
            href: "/organizations",
            icon: Users,
            tone: "neutral",
          },
          {
            title: "Campus Venues",
            value: String(metrics?.campusVenues ?? 0),
            subtitle: "Available spaces",
            href: "/venues",
            icon: MapPin,
            tone: "neutral",
          },
        ]
      : canCreateProposals
        ? [
            {
              title: "My Draft Proposals",
              value: String(metrics?.myDraftProposals ?? 0),
              subtitle: "Drafts & returned",
              href: "/events",
              icon: FileText,
              tone: "warning",
            },
            {
              title: "Active Events",
              value: String(metrics?.activeEvents ?? 0),
              subtitle: "Scheduled on campus",
              href: "/events",
              icon: CheckCircle2,
              tone: "accent",
            },
            {
              title: "Org Registrations",
              value: String(totalRegs),
              subtitle: "Organization signups",
              href: "/events",
              icon: Ticket,
              tone: "accent",
            },
            {
              title: "Verified Attendees",
              value: String(totalAttended),
              subtitle: "Organization check-ins",
              href: "/attendance",
              icon: UserCheck,
              tone: "success",
              badgeText: turnoutRate !== null ? `${turnoutRate}% turnout` : undefined,
              progressPercent: turnoutRate ?? undefined,
            },
          ]
        : [
            {
              title: "My Registrations",
              value: String(metrics?.myRegistrations ?? 0),
              subtitle: "Confirmed active passes",
              href: "/registrations",
              icon: CalendarCheck2,
              tone: "accent",
            },
            {
              title: "Events Attended",
              value: String(metrics?.myAttended ?? 0),
              subtitle: "Verified attendance",
              href: "/registrations",
              icon: CheckCircle2,
              tone: "success",
            },
            {
              title: "Active Events",
              value: String(metrics?.activeEvents ?? 0),
              subtitle: "Open on campus",
              href: "/events",
              icon: Calendar,
              tone: "warning",
            },
            {
              title: "Recognized Orgs",
              value: String(metrics?.recognizedOrgs ?? 0),
              subtitle: "Student organizations",
              href: "/organizations",
              icon: Users,
              tone: "neutral",
            },
          ];

  const actionQueue = metrics?.actionQueue ?? [];
  const recentPasses = metrics?.recentPasses ?? [];
  const upcomingEvents = metrics?.upcomingEvents ?? [];
  const showProposalPanel =
    canApproveProposals || canEndorseProposals || canCreateProposals;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Welcome Page Header */}
      <PageHeader
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {canApproveProposals ? (
              <>
                <NextLink href="/events">
                  <Button size="md" variant="primary">
                    <Clock size={16} />
                    Review Proposals
                  </Button>
                </NextLink>
                {canManageAttendance ? (
                  <NextLink href="/attendance">
                    <Button size="md" variant="secondary">
                      <UserCheck size={16} />
                      Attendance Desk
                    </Button>
                  </NextLink>
                ) : null}
              </>
            ) : canCreateProposals ? (
              <>
                <NextLink href="/events/new">
                  <Button size="md" variant="primary">
                    <FilePlus size={16} />
                    Draft New Proposal
                  </Button>
                </NextLink>
                {canManageAttendance ? (
                  <NextLink href="/attendance">
                    <Button size="md" variant="secondary">
                      <UserCheck size={16} />
                      Attendance Desk
                    </Button>
                  </NextLink>
                ) : null}
              </>
            ) : canEndorseProposals ? (
              <NextLink href="/events">
                <Button size="md" variant="primary">
                  <Clock size={16} />
                  Review Endorsements
                </Button>
              </NextLink>
            ) : canRegisterEvents ? (
              <NextLink href="/events">
                <Button size="md" variant="primary">
                  <CalendarCheck2 size={16} />
                  Browse Events
                </Button>
              </NextLink>
            ) : null}
          </div>
        }
        badge={
          user.isSuperuser ? (
            <Chip color="danger" size="sm" variant="soft">
              <ShieldCheck className="mr-1 inline" size={12} />
              SUPERUSER
            </Chip>
          ) : user.isStaff ? (
            <Chip color="accent" size="sm" variant="soft">
              STAFF
            </Chip>
          ) : user.groups[0] ? (
            <Chip size="sm" variant="soft">
              {user.groups[0]}
            </Chip>
          ) : undefined
        }
        description="Welcome to OrGanap. Here is the live operational snapshot for your campus roles, registrations, and events."
        title={`Hello, ${displayName}!`}
      />

      {/* 4 Role-Scoped Actionable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const toneStyle = KPI_TONE_STYLES[kpi.tone];

          return (
            <NextLink key={kpi.title} className="group block h-full" href={kpi.href}>
              <Card className="relative h-full overflow-hidden rounded-3xl border border-border/40 bg-surface p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md flex flex-col justify-between gap-4">
                <span
                  aria-hidden="true"
                  className={clsx("absolute inset-x-0 top-0 h-1", toneStyle.bar)}
                />

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={clsx(
                        "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0",
                        toneStyle.iconBox,
                      )}
                    >
                      <kpi.icon size={18} />
                    </div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted leading-tight">
                      {kpi.title}
                    </span>
                  </div>
                  <ArrowUpRight
                    className="text-muted/50 group-hover:text-accent group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5"
                    size={15}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums leading-none">
                      {kpi.value}
                    </span>
                    {kpi.badgeText ? (
                      <Chip color={toneStyle.chipColor} size="sm" variant="soft">
                        {kpi.badgeText}
                      </Chip>
                    ) : null}
                  </div>

                  {kpi.progressPercent !== undefined ? (
                    <div className="w-full h-1.5 rounded-full bg-default/20 overflow-hidden">
                      <div
                        className={clsx(
                          "h-full rounded-full transition-all duration-300",
                          toneStyle.progress,
                        )}
                        style={{ width: `${kpi.progressPercent}%` }}
                      />
                    </div>
                  ) : null}

                  <span className="text-xs text-muted truncate">
                    {kpi.subtitle}
                  </span>
                </div>
              </Card>
            </NextLink>
          );
        })}
      </div>

      {/* Live Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Panel: Role Action Queue OR Student Passes */}
        <Card className="border border-border/40 bg-surface p-5 flex flex-col gap-4 rounded-3xl">
          <Card.Header className="p-0 flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <Card.Title className="text-base font-bold text-foreground">
                {showProposalPanel
                  ? canApproveProposals
                    ? "Student Affairs Review Queue"
                    : canEndorseProposals
                      ? "Pending Adviser Endorsements"
                      : "Organization Proposal Pipeline"
                  : "My Event Passes"}
              </Card.Title>
              <Card.Description className="text-xs text-muted mt-0.5">
                {showProposalPanel
                  ? "Submissions currently awaiting review, revision, or endorsement."
                  : "Your confirmed entry tickets and attended event records."}
              </Card.Description>
            </div>
            <NextLink
              className="shrink-0"
              href={showProposalPanel ? "/events" : "/registrations"}
            >
              <Button size="sm" variant="ghost">
                View All <ArrowRight size={14} />
              </Button>
            </NextLink>
          </Card.Header>

          <Card.Content className="p-0 flex flex-col gap-2.5">
            {showProposalPanel ? (
              actionQueue.length > 0 ? (
                actionQueue.map((item) => (
                  <NextLink
                    key={item.id}
                    className="p-3 rounded-2xl border border-border/30 hover:border-accent/40 bg-default/5 transition-colors flex items-center justify-between gap-3"
                    href={`/events/${item.id}?view=review`}
                  >
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-muted">
                        {item.organizationAcronym} · Updated{" "}
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <ProposalStatusChip status={item.status} />
                  </NextLink>
                ))
              ) : (
                <EmptyState className="py-6 flex flex-col items-center text-center gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-default/15 text-muted flex items-center justify-center">
                    <Inbox size={20} />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {canApproveProposals || canEndorseProposals
                      ? "Review Queue Is Clear"
                      : "No Active Proposals"}
                  </p>
                  <p className="text-xs text-muted max-w-xs">
                    {canCreateProposals
                      ? "Draft an event proposal to start the adviser and Student Affairs review process."
                      : "New proposals requiring your review will appear here automatically."}
                  </p>
                  {canCreateProposals ? (
                    <NextLink className="mt-1" href="/events/new">
                      <Button size="sm" variant="secondary">
                        <FilePlus size={14} />
                        Draft Proposal
                      </Button>
                    </NextLink>
                  ) : null}
                </EmptyState>
              )
            ) : recentPasses.length > 0 ? (
              recentPasses.map((pass) => (
                <NextLink
                  key={pass.registrationId}
                  className="p-3 rounded-2xl border border-border/30 hover:border-accent/40 bg-default/5 transition-colors flex items-center justify-between gap-3"
                  href={`/events/${pass.eventId}`}
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {pass.eventTitle}
                    </span>
                    <span className="text-[11px] text-muted truncate">
                      {pass.venueName} ·{" "}
                      {pass.startTime
                        ? new Date(pass.startTime).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : "Scheduled"}
                    </span>
                  </div>
                  <Chip
                    color={pass.status === "attended" ? "accent" : "success"}
                    size="sm"
                    variant="soft"
                  >
                    {pass.status === "attended" ? "Attended" : "Confirmed"}
                  </Chip>
                </NextLink>
              ))
            ) : (
              <EmptyState className="py-6 flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-default/15 text-muted flex items-center justify-center">
                  <Ticket size={20} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No Event Registrations Yet
                </p>
                <p className="text-xs text-muted max-w-xs">
                  Browse approved campus events to reserve your seat and generate a QR entry pass.
                </p>
                <NextLink className="mt-1" href="/events">
                  <Button size="sm" variant="primary">
                    Explore Campus Events
                    <ArrowRight size={14} />
                  </Button>
                </NextLink>
              </EmptyState>
            )}
          </Card.Content>
        </Card>

        {/* Right Panel: Upcoming Approved Campus Events */}
        <Card className="border border-border/40 bg-surface p-5 flex flex-col gap-4 rounded-3xl">
          <Card.Header className="p-0 flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <Card.Title className="text-base font-bold text-foreground">
                Upcoming Approved Events
              </Card.Title>
              <Card.Description className="text-xs text-muted mt-0.5">
                Live and scheduled campus activities open for viewing and attendance.
              </Card.Description>
            </div>
            <NextLink className="shrink-0" href="/events">
              <Button size="sm" variant="ghost">
                Catalog <ArrowRight size={14} />
              </Button>
            </NextLink>
          </Card.Header>

          <Card.Content className="p-0 flex flex-col gap-2.5">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((ev) => (
                <NextLink
                  key={ev.id}
                  className="p-3 rounded-2xl border border-border/30 hover:border-accent/40 bg-default/5 transition-colors flex items-center justify-between gap-3"
                  href={`/events/${ev.id}`}
                >
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {ev.title}
                    </span>
                    <span className="text-[11px] text-muted truncate">
                      {ev.organizationAcronym} · {ev.venueName} ·{" "}
                      {new Date(ev.startTime).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <Chip color="default" size="sm" variant="soft">
                    {ev.registeredCount}/{ev.capacity}
                  </Chip>
                </NextLink>
              ))
            ) : (
              <EmptyState className="py-6 flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-2xl bg-default/15 text-muted flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  No Upcoming Approved Events
                </p>
                <p className="text-xs text-muted max-w-xs">
                  Approved student organization events will appear here once finalized by Student Affairs.
                </p>
                <NextLink className="mt-1" href="/events">
                  <Button size="sm" variant="secondary">
                    Open Events Catalog
                    <ArrowRight size={14} />
                  </Button>
                </NextLink>
              </EmptyState>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Institutional Snapshot Strip for Student Affairs & Superadmins */}
      {canApproveProposals ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <NextLink
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-surface px-4 py-3.5 transition-colors hover:border-accent/40"
            href="/organizations"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Users size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted truncate">Recognized Organizations</p>
                <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
                  {metrics?.recognizedOrgs ?? 0}
                </p>
              </div>
            </div>
            <ArrowUpRight
              className="text-muted/60 group-hover:text-accent transition-colors shrink-0"
              size={15}
            />
          </NextLink>

          <NextLink
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-surface px-4 py-3.5 transition-colors hover:border-accent/40"
            href="/venues"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0">
                <Building2 size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted truncate">Campus Venues</p>
                <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
                  {metrics?.campusVenues ?? 0}
                </p>
              </div>
            </div>
            <ArrowUpRight
              className="text-muted/60 group-hover:text-accent transition-colors shrink-0"
              size={15}
            />
          </NextLink>

          <NextLink
            className="group flex items-center justify-between gap-3 rounded-2xl border border-border/40 bg-surface px-4 py-3.5 transition-colors hover:border-accent/40"
            href="/events"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0">
                <Clock size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted truncate">Awaiting Adviser Endorsement</p>
                <p className="text-lg font-bold text-foreground tabular-nums leading-tight">
                  {metrics?.awaitingEndorsement ?? 0}
                </p>
              </div>
            </div>
            <ArrowUpRight
              className="text-muted/60 group-hover:text-accent transition-colors shrink-0"
              size={15}
            />
          </NextLink>
        </div>
      ) : null}
    </div>
  );
}
