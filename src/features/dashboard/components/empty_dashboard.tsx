"use client";

// Role-tailored initial empty dashboard for OrGanap.
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
} from "lucide-react";


export function EmptyDashboard({ user }: { user: AuthUser }) {
  const role = user.role;
  const displayName = user.displayName || user.email.split("@")[0];

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-surface border border-border/40 shadow-sm">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hello, {displayName}!
            </h1>
            <Chip size="sm" variant="soft">
              {role.toUpperCase()}
            </Chip>
          </div>
          <p className="text-muted text-sm">
            Welcome to OrGanap. Here is the operational status of your student event activities.
          </p>
        </div>

        {role === "officer" && (
          <NextLink href="/proposals/new">
            <Button size="md" variant="primary">
              <FilePlus size={16} />
              Draft New Proposal
            </Button>
          </NextLink>
        )}

        {role === "student" && (
          <NextLink href="/events">
            <Button size="md" variant="primary">
              <CalendarCheck2 size={16} />
              Browse Events
            </Button>
          </NextLink>
        )}

        {(role === "student_affairs" || role === "superadmin") && (
          <NextLink href="/proposals">
            <Button size="md" variant="primary">
              <Clock size={16} />
              Review Proposals
            </Button>
          </NextLink>
        )}
      </div>

      {/* Role-Specific Metric Cards */}
      {role === "student" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Events Attended</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-success/10 text-success">
                <CheckCircle2 size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Campus Organizations</p>
                <p className="text-2xl font-bold text-foreground mt-1">5</p>
              </div>
              <div className="p-3 rounded-2xl bg-default/20 text-muted">
                <Users size={20} />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {role === "officer" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Draft Proposals</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-default/20 text-muted">
                <FileText size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Pending Adviser</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-warning/10 text-warning">
                <Clock size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Pending Affairs</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                <Inbox size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Approved Events</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-success/10 text-success">
                <CheckCircle2 size={20} />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {role === "adviser" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Awaiting Endorsement</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-warning/10 text-warning">
                <Inbox size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Endorsed to SA</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                <CheckCircle2 size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Assigned Orgs</p>
                <p className="text-2xl font-bold text-foreground mt-1">1</p>
              </div>
              <div className="p-3 rounded-2xl bg-default/20 text-muted">
                <Users size={20} />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {(role === "student_affairs" || role === "superadmin") && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Final Reviews</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-warning/10 text-warning">
                <Inbox size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Active Venues</p>
                <p className="text-2xl font-bold text-foreground mt-1">5</p>
              </div>
              <div className="p-3 rounded-2xl bg-accent/10 text-accent">
                <Building2 size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Organizations</p>
                <p className="text-2xl font-bold text-foreground mt-1">5</p>
              </div>
              <div className="p-3 rounded-2xl bg-default/20 text-muted">
                <Users size={20} />
              </div>
            </Card.Content>
          </Card>

          <Card className="p-4 border border-border/30">
            <Card.Content className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted uppercase">Active Events</p>
                <p className="text-2xl font-bold text-foreground mt-1">0</p>
              </div>
              <div className="p-3 rounded-2xl bg-success/10 text-success">
                <CalendarCheck2 size={20} />
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Empty State Card */}
      <Card className="border border-border/40 p-8 text-center bg-surface">
        <Card.Content className="flex flex-col items-center max-w-md mx-auto gap-4 py-8">
          <div className="w-16 h-16 rounded-3xl bg-accent/10 text-accent flex items-center justify-center shadow-sm">
            <Sparkles size={32} />
          </div>

          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-bold text-foreground">
              {role === "student" && "No Event Registrations Yet"}
              {role === "officer" && "No Event Proposals Created"}
              {role === "adviser" && "No Proposals Awaiting Endorsement"}
              {(role === "student_affairs" || role === "superadmin") && "Review Queue Is Clear"}
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              {role === "student" &&
                "Explore upcoming student organization events across campus, reserve your slot before capacity fills up, and generate digital check-in passes."}
              {role === "officer" &&
                "Start by drafting an event proposal for your organization. OrGanap will guide it through faculty adviser endorsement and Student Affairs venue verification."}
              {role === "adviser" &&
                "When your assigned student organizations submit event proposals, they will arrive here for your endorsement and feedback."}
              {(role === "student_affairs" || role === "superadmin") &&
                "All endorsed proposals have been evaluated. New submissions from faculty advisers will appear in real time."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {role === "student" && (
              <NextLink href="/events">
                <Button size="md" variant="primary">
                  Explore Campus Events
                  <ArrowRight size={16} />
                </Button>
              </NextLink>
            )}

            {role === "officer" && (
              <NextLink href="/proposals/new">
                <Button size="md" variant="primary">
                  Create Event Proposal
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
