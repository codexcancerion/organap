"use client";

// Dynamic permission-governed operational dashboard for OrGanap (FR-18).
import type { AuthUser } from "@/types";
import type { DashboardMetrics } from "../types";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Chip, EmptyState } from "@heroui/react";
import {
  ArrowRight,
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

  // Role-adapted 4 KPI cards (FR-18)
  const kpis = canApproveProposals
    ? [
        {
          title: "Pending Approvals",
          value: String(metrics?.pendingApprovals ?? 0),
          subtitle: "Awaiting final review",
          icon: Inbox,
          colorClass: "bg-danger/10 text-danger",
        },
        {
          title: "Active Events",
          value: String(metrics?.activeEvents ?? 0),
          subtitle: "Scheduled on campus",
          icon: CheckCircle2,
          colorClass: "bg-accent/10 text-accent",
        },
        {
          title: "Total Registrations",
          value: String(metrics?.totalRegistrations ?? 0),
          subtitle: "Confirmed across campus",
          icon: Ticket,
          colorClass: "bg-primary/10 text-primary",
        },
        {
          title: "Recorded Attendees",
          value: String(metrics?.totalAttended ?? 0),
          subtitle: "Verified check-ins",
          icon: UserCheck,
          colorClass: "bg-success/10 text-success",
        },
      ]
    : canEndorseProposals
      ? [
          {
            title: "Awaiting Endorsement",
            value: String(metrics?.awaitingEndorsement ?? 0),
            subtitle: "Assigned organizations",
            icon: Clock,
            colorClass: "bg-warning/10 text-warning",
          },
          {
            title: "Active Events",
            value: String(metrics?.activeEvents ?? 0),
            subtitle: "Scheduled on campus",
            icon: CheckCircle2,
            colorClass: "bg-accent/10 text-accent",
          },
          {
            title: "Recognized Orgs",
            value: String(metrics?.recognizedOrgs ?? 0),
            subtitle: "Student organizations",
            icon: Users,
            colorClass: "bg-default/20 text-muted",
          },
          {
            title: "Campus Venues",
            value: String(metrics?.campusVenues ?? 0),
            subtitle: "Available spaces",
            icon: MapPin,
            colorClass: "bg-default/20 text-muted",
          },
        ]
      : canCreateProposals
        ? [
            {
              title: "My Draft Proposals",
              value: String(metrics?.myDraftProposals ?? 0),
              subtitle: "Drafts & returned",
              icon: FileText,
              colorClass: "bg-warning/10 text-warning",
            },
            {
              title: "Active Events",
              value: String(metrics?.activeEvents ?? 0),
              subtitle: "Scheduled on campus",
              icon: CheckCircle2,
              colorClass: "bg-accent/10 text-accent",
            },
            {
              title: "Org Registrations",
              value: String(metrics?.totalRegistrations ?? 0),
              subtitle: "Organization signups",
              icon: Ticket,
              colorClass: "bg-primary/10 text-primary",
            },
            {
              title: "Verified Attendees",
              value: String(metrics?.totalAttended ?? 0),
              subtitle: "Organization check-ins",
              icon: UserCheck,
              colorClass: "bg-success/10 text-success",
            },
          ]
        : [
            {
              title: "My Registrations",
              value: String(metrics?.myRegistrations ?? 0),
              subtitle: "Confirmed active passes",
              icon: CalendarCheck2,
              colorClass: "bg-accent/10 text-accent",
            },
            {
              title: "Events Attended",
              value: String(metrics?.myAttended ?? 0),
              subtitle: "Verified attendance",
              icon: CheckCircle2,
              colorClass: "bg-success/10 text-success",
            },
            {
              title: "Active Events",
              value: String(metrics?.activeEvents ?? 0),
              subtitle: "Open on campus",
              icon: Calendar,
              colorClass: "bg-primary/10 text-primary",
            },
            {
              title: "Recognized Orgs",
              value: String(metrics?.recognizedOrgs ?? 0),
              subtitle: "Student organizations",
              icon: Users,
              colorClass: "bg-default/20 text-muted",
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
            {canCreateProposals && (
              <NextLink href="/events/new">
                <Button size="md" variant="primary">
                  <FilePlus size={16} />
                  Draft New Proposal
                </Button>
              </NextLink>
            )}

            {canApproveProposals && (
              <NextLink href="/events">
                <Button size="md" variant="secondary">
                  <Clock size={16} />
                  Review Proposals
                </Button>
              </NextLink>
            )}

            {canManageAttendance && (
              <NextLink href="/attendance">
                <Button size="md" variant="secondary">
                  <UserCheck size={16} />
                  Attendance Desk
                </Button>
              </NextLink>
            )}

            {canRegisterEvents && !canCreateProposals && !canApproveProposals && (
              <NextLink href="/events">
                <Button size="md" variant="primary">
                  <CalendarCheck2 size={16} />
                  Browse Events
                </Button>
              </NextLink>
            )}
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

      {/* 4 Role-Scoped KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card
            key={kpi.title}
            className="p-5 border border-border/40 bg-surface rounded-3xl shadow-xs hover:border-border/80 transition-all flex flex-col justify-between gap-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                {kpi.title}
              </span>
              <div className={clsx("p-2.5 rounded-2xl shrink-0 shadow-xs", kpi.colorClass)}>
                <kpi.icon size={20} />
              </div>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
                {kpi.value}
              </span>
              <span className="text-xs text-muted truncate">
                {kpi.subtitle}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Live Operational Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Panel: Role Action Queue OR Student Passes */}
        <Card className="border border-border/40 bg-surface p-5 flex flex-col gap-4">
          <Card.Header className="p-0 flex items-center justify-between gap-2">
            <div>
              <Card.Title className="text-base font-bold text-foreground">
                {showProposalPanel
                  ? canApproveProposals
                    ? "Student Affairs Review Queue"
                    : canEndorseProposals
                      ? "Pending Adviser Endorsements"
                      : "Organization Proposal Pipeline"
                  : "My Event Passes"}
              </Card.Title>
              <Card.Description className="text-xs text-muted">
                {showProposalPanel
                  ? "Submissions currently awaiting review, revision, or endorsement."
                  : "Your confirmed entry tickets and attended event records."}
              </Card.Description>
            </div>
            <NextLink href={showProposalPanel ? "/events" : "/registrations"}>
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
                <EmptyState className="py-8 flex flex-col items-center text-center gap-2">
                  <Inbox className="text-muted size-8" />
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
              <EmptyState className="py-8 flex flex-col items-center text-center gap-2">
                <Ticket className="text-muted size-8" />
                <p className="text-sm font-semibold text-foreground">
                  No Event Registrations Yet
                </p>
                <p className="text-xs text-muted max-w-xs">
                  Browse approved campus events to reserve your seat and generate a QR entry pass.
                </p>
                <NextLink href="/events">
                  <Button className="mt-1" size="sm" variant="primary">
                    Explore Campus Events
                    <ArrowRight size={14} />
                  </Button>
                </NextLink>
              </EmptyState>
            )}
          </Card.Content>
        </Card>

        {/* Right Panel: Upcoming Approved Campus Events */}
        <Card className="border border-border/40 bg-surface p-5 flex flex-col gap-4">
          <Card.Header className="p-0 flex items-center justify-between gap-2">
            <div>
              <Card.Title className="text-base font-bold text-foreground">
                Upcoming Approved Events
              </Card.Title>
              <Card.Description className="text-xs text-muted">
                Live and scheduled campus activities open for viewing and attendance.
              </Card.Description>
            </div>
            <NextLink href="/events">
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
              <EmptyState className="py-8 flex flex-col items-center text-center gap-2">
                <Calendar className="text-muted size-8" />
                <p className="text-sm font-semibold text-foreground">
                  No Upcoming Approved Events
                </p>
                <p className="text-xs text-muted max-w-xs">
                  Approved student organization events will appear here once finalized by Student Affairs.
                </p>
              </EmptyState>
            )}
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
