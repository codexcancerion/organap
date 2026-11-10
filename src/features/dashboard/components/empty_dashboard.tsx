"use client";

// Dynamic permission-governed empty dashboard for OrGanap (Django-style RBAC).
import type { AuthUser } from "@/types";
import type { DashboardMetrics } from "../types";

import React from "react";
import NextLink from "next/link";
import { Button, Card, Chip } from "@heroui/react";
import {
  CalendarCheck2,
  FilePlus,
  FileText,
  Clock,
  Building2,
  Users,
  CheckCircle2,
  Inbox,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import clsx from "clsx";

import { PageHeader } from "@/components/layout/page_header";

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
  const canApproveProposals = hasPerm("proposals.approve");
  const canRegisterEvents = hasPerm("events.register");
  const canManageVenues = hasPerm("venues.create") || hasPerm("venues.change");

  // Determine the 3 most important KPIs for the user's role
  const primaryKpi = canApproveProposals
    ? {
        title: "Pending Approvals",
        value: String(metrics?.pendingApprovals ?? 0),
        subtitle: "Awaiting review",
        icon: Inbox,
        colorClass: "bg-danger/10 text-danger",
      }
    : canEndorseProposals
      ? {
          title: "Awaiting Endorsement",
          value: String(metrics?.awaitingEndorsement ?? 0),
          subtitle: "Faculty review",
          icon: Clock,
          colorClass: "bg-warning/10 text-warning",
        }
      : canCreateProposals
        ? {
            title: "My Draft Proposals",
            value: String(metrics?.myDraftProposals ?? 0),
            subtitle: "In review / draft",
            icon: FileText,
            colorClass: "bg-danger/10 text-danger",
          }
        : {
            title: "My Registrations",
            value: String(metrics?.myRegistrations ?? 0),
            subtitle: "Confirmed passes",
            icon: CalendarCheck2,
            colorClass: "bg-primary/10 text-primary",
          };

  const secondaryKpi = {
    title: "Active Events",
    value: String(metrics?.activeEvents ?? 0),
    subtitle: "Scheduled on campus",
    icon: CheckCircle2,
    colorClass: "bg-primary/10 text-primary",
  };

  const tertiaryKpi = canManageVenues && !canCreateProposals
    ? {
        title: "Campus Venues",
        value: String(metrics?.campusVenues ?? 5),
        subtitle: "Available spaces",
        icon: Building2,
        colorClass: "bg-default/20 text-muted",
      }
    : {
        title: "Recognized Orgs",
        value: String(metrics?.recognizedOrgs ?? 5),
        subtitle: "Student organizations",
        icon: Users,
        colorClass: "bg-default/20 text-muted",
      };

  const kpis = [primaryKpi, secondaryKpi, tertiaryKpi];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Welcome Page Header */}
      <PageHeader
        actions={
          <>
            {canCreateProposals && (
              <NextLink href="/proposals/new">
                <Button size="md" variant="primary">
                  <FilePlus size={16} />
                  Draft New Proposal
                </Button>
              </NextLink>
            )}

            {canApproveProposals && (
              <NextLink href="/proposals">
                <Button size="md" variant="secondary">
                  <Clock size={16} />
                  Review Proposals
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
          </>
        }
        badge={
          <div className="flex items-center gap-1.5 flex-wrap">
            {user.isSuperuser && (
              <Chip className="bg-danger/10 text-danger border border-danger/20 font-semibold" size="sm" variant="soft">
                <ShieldCheck className="mr-1 inline" size={12} />
                SUPERUSER
              </Chip>
            )}
            {user.isStaff && !user.isSuperuser && (
              <Chip className="bg-primary/10 text-primary border border-primary/20 font-semibold" size="sm" variant="soft">
                STAFF
              </Chip>
            )}
            {user.groups.map((group) => (
              <Chip key={group} size="sm" variant="soft">
                {group}
              </Chip>
            ))}
          </div>
        }
        description="Welcome to OrGanap. Here is the operational status of your campus event permissions and activities."
        title={`Hello, ${displayName}!`}
      />

      {/* 3 Redesigned Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <span className="text-3xl font-extrabold tracking-tight text-foreground">
                {kpi.value}
              </span>
              <span className="text-xs text-muted truncate">
                {kpi.subtitle}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State Card */}
      <Card className="border border-border/40 p-8 text-center bg-surface">
        <Card.Content className="flex flex-col items-center max-w-md mx-auto gap-4 py-8">
          <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center shadow-sm">
            <Sparkles size={32} />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">
              {canApproveProposals
                ? "Review Queue Is Clear"
                : canEndorseProposals
                  ? "No Proposals Awaiting Endorsement"
                  : canCreateProposals
                    ? "No Event Proposals Created"
                    : "No Event Registrations Yet"}
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              {canApproveProposals
                ? "All submitted proposals have been evaluated. New submissions requiring Student Affairs verification will appear here in real time."
                : canEndorseProposals
                  ? "When your assigned student organizations submit event proposals, they will arrive here for faculty review and endorsement."
                  : canCreateProposals
                    ? "Start by drafting an event proposal for your student organization. OrGanap will guide it through faculty endorsement and administrative venue approval."
                    : "Explore upcoming student organization events across campus, reserve your participation slot, and generate digital check-in passes."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {canCreateProposals && (
              <NextLink href="/proposals/new">
                <Button size="md" variant="primary">
                  Create Event Proposal
                  <ArrowRight size={16} />
                </Button>
              </NextLink>
            )}

            {canRegisterEvents && (
              <NextLink href="/events">
                <Button size="md" variant="primary">
                  Explore Campus Events
                  <ArrowRight size={16} />
                </Button>
              </NextLink>
            )}

            <NextLink href="/organizations">
              <Button size="md" variant="secondary">
                View Organizations
              </Button>
            </NextLink>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
