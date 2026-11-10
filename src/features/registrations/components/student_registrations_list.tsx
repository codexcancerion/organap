"use client";

import type { StudentPassItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Chip,
} from "@heroui/react";
import {
  Calendar,
  MapPin,
  Building2,
  Ticket,
  CheckCircle2,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";

import { DigitalTicketPass } from "./digital_ticket_pass";

export type StudentRegistrationsListProps = {
  passes: StudentPassItem[];
  studentName: string;
  schoolId: string;
};

export function StudentRegistrationsList({
  passes,
  studentName,
  schoolId,
}: StudentRegistrationsListProps) {
  const [activePass, setActivePass] = React.useState<StudentPassItem | null>(null);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          <NextLink href="/events">
            <Button size="md" variant="primary">
              <Calendar size={16} />
              Browse More Events
            </Button>
          </NextLink>
        }
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            {passes.length} Active Passes
          </span>
        }
        description="Access and present your official entry tickets and QR codes for campus student organization events."
        title="My Event Passes"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
        {passes.map((pass) => (
          <Card
            key={pass.registrationId}
            className="border border-border/30 hover:border-accent/40 transition-colors bg-surface p-5 gap-3 cursor-pointer"
            onClick={() => setActivePass(pass)}
          >
            <Card.Header className="flex flex-col gap-1 p-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-accent flex items-center gap-1">
                  <Building2 size={13} />
                  {pass.organizationAcronym}
                </span>
                <Chip
                  className={pass.status === "attended" ? "bg-accent/15 text-accent" : "bg-success/15 text-success"}
                  size="sm"
                  variant="soft"
                >
                  <CheckCircle2 className="mr-1 inline" size={12} />
                  {pass.status === "attended" ? "Attended" : "Confirmed"}
                </Chip>
              </div>

              <h3 className="font-bold text-base text-foreground line-clamp-2">
                {pass.eventTitle}
              </h3>
            </Card.Header>

            <Card.Content className="p-0 flex-initial pt-2 border-t border-border/20 flex flex-col gap-2 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <MapPin className="text-primary shrink-0" size={13} />
                <span className="truncate">{pass.venueName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="text-primary shrink-0" size={13} />
                <span>{new Date(pass.startTime).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · {new Date(pass.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </Card.Content>

            <Card.Footer className="p-0 pt-2 flex items-center justify-between border-t border-border/20 text-xs text-muted">
              <span className="font-mono text-[11px]">Passcode #{pass.qrToken.slice(0, 6)}</span>
              <Button size="sm" variant="primary" onClick={() => setActivePass(pass)}>
                <Ticket size={14} />
                Show Ticket
              </Button>
            </Card.Footer>
          </Card>
        ))}
      </div>

      {passes.length === 0 && (
        <Card className="border border-dashed border-border/60 bg-surface p-12 text-center flex flex-col items-center gap-3">
          <Ticket className="text-muted size-10" />
          <h3 className="text-base font-semibold text-foreground">No Confirmed Registrations</h3>
          <p className="text-xs text-muted max-w-sm">
            You have not registered for any upcoming events yet. Explore the campus events directory and claim your pass!
          </p>
          <NextLink href="/events">
            <Button className="mt-2" size="sm" variant="primary">
              <Calendar size={15} />
              Explore Events
            </Button>
          </NextLink>
        </Card>
      )}

      {/* Ticket Pass Modal */}
      {activePass && (
        <DigitalTicketPass
          endTime={activePass.endTime}
          eventTitle={activePass.eventTitle}
          isOpen={!!activePass}
          organizationName={activePass.organizationName}
          qrToken={activePass.qrToken}
          schoolId={schoolId}
          startTime={activePass.startTime}
          status={activePass.status === "attended" ? "attended" : "confirmed"}
          studentName={studentName}
          venueName={activePass.venueName}
          onOpenChange={(open) => !open && setActivePass(null)}
        />
      )}
    </div>
  );
}
