"use client";

// Dynamic permission-governed empty dashboard for OrGanap (Django-style RBAC).
import type { AuthUser } from "@/types";

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

export function EmptyDashboard({ user }: { user: AuthUser }) {
  const displayName = user.displayName || user.email.split("@")[0];

  const hasPerm = (code: string) => user.isSuperuser || user.permissions.includes(code);

  const canCreateProposals = hasPerm("proposals.create");
  const canEndorseProposals = hasPerm("proposals.endorse");
  const canApproveProposals = hasPerm("proposals.approve");
  const canRegisterEvents = hasPerm("events.register");
  const canManageVenues = hasPerm("venues.create") || hasPerm("venues.change");

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-border/40 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {displayName}!
            </h1>
            {user.isSuperuser && (
              <Chip className="bg-danger/10 text-danger border border-danger/20" size="sm" variant="soft">
                <ShieldCheck className="mr-1 inline" size={12} />
                SUPERUSER
              </Chip>
            )}
            {user.isStaff && !user.isSuperuser && (
              <Chip className="bg-primary/10 text-primary border border-primary/20" size="sm" variant="soft">
                STAFF
              </Chip>
            )}
            {user.groups.map((group) => (
              <Chip key={group} size="sm" variant="soft">
                {group}
              </Chip>
            ))}
          </div>
          <p className="text-muted text-sm">
            Welcome to OrGanap. Here is the operational status of your campus event permissions and activities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>

      {/* Dynamic Metric Cards based on Permissions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {canApproveProposals && (
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Pending Approvals</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-danger/10 text-danger">
                <Inbox size={20} />
              </div>
            </Card.Content>
          </Card>
        )}

        {canEndorseProposals && (
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Awaiting Endorsement</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-warning/10 text-warning">
                <Clock size={20} />
              </div>
            </Card.Content>
          </Card>
        )}

        {canCreateProposals && (
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">My Draft Proposals</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-default/20 text-muted">
                <FileText size={20} />
              </div>
            </Card.Content>
          </Card>
        )}

        {canManageVenues && (
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Campus Venues</p>
                <p className="text-2xl font-bold text-foreground mt-1">5</p>
              </div>
              <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                <Building2 size={20} />
              </div>
            </Card.Content>
          </Card>
        )}

        <Card className="p-4 border border-border/30">
          <Card.Content className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Recognized Orgs</p>
              <p className="text-2xl font-bold text-foreground mt-1">5</p>
            </div>
            <div className="p-3 rounded-2xl bg-default/20 text-muted">
              <Users size={20} />
            </div>
          </Card.Content>
        </Card>

        {canRegisterEvents && (
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">My Registrations</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                <CalendarCheck2 size={20} />
              </div>
            </Card.Content>
          </Card>
        )}

        <Card className="p-4 border border-border/30">
          <Card.Content className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted uppercase">Active Events</p>
              <p className="text-2xl font-bold text-foreground mt-1">0</p>
            </div>
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 size={20} />
            </div>
          </Card.Content>
        </Card>
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
