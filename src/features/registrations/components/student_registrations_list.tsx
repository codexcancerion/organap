"use client";

import type { StudentPassItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  SearchField,
  Spinner,
  toast,
} from "@heroui/react";
import {
  ArrowRight,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Ticket,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";
import { CatalogFilterDropdown } from "@/components/ui/catalog_filter_dropdown";

import { withdrawFromEvent } from "../services/registration_services";

import { DigitalTicketPass } from "./digital_ticket_pass";

export type StudentRegistrationsListProps = {
  passes: StudentPassItem[];
  studentName: string;
  schoolId: string;
};

type PassFilterTab = "all" | "upcoming" | "attended" | "past";

export function StudentRegistrationsList({
  passes,
  studentName,
  schoolId,
}: StudentRegistrationsListProps) {
  const router = useRouter();
  const [activePass, setActivePass] = React.useState<StudentPassItem | null>(null);
  const [withdrawTarget, setWithdrawTarget] = React.useState<StudentPassItem | null>(null);
  const [withdrawnIds, setWithdrawnIds] = React.useState<Set<string>>(() => new Set());
  const [isWithdrawing, setIsWithdrawing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState<PassFilterTab>("all");

  const visiblePasses = React.useMemo(
    () => passes.filter((p) => !withdrawnIds.has(p.registrationId)),
    [passes, withdrawnIds]
  );

  const [nowMs] = React.useState(() => Date.now());

  const { upcomingCount, attendedCount, pastCount } = React.useMemo(() => {
    let upcoming = 0;
    let attended = 0;
    let past = 0;

    for (const p of visiblePasses) {
      const isCancelled = p.eventStatus === "cancelled";
      const isEnded = p.endTime ? new Date(p.endTime).getTime() < nowMs : false;

      if (p.status === "attended") {
        attended += 1;
      } else if (isCancelled || isEnded) {
        past += 1;
      } else {
        upcoming += 1;
      }
    }

    return { upcomingCount: upcoming, attendedCount: attended, pastCount: past };
  }, [visiblePasses, nowMs]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return visiblePasses.filter((p) => {
      const matchSearch =
        !q ||
        p.eventTitle.toLowerCase().includes(q) ||
        p.organizationName.toLowerCase().includes(q) ||
        p.organizationAcronym.toLowerCase().includes(q) ||
        p.venueName.toLowerCase().includes(q) ||
        p.qrToken.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const isCancelled = p.eventStatus === "cancelled";
      const isEnded = p.endTime ? new Date(p.endTime).getTime() < nowMs : false;

      if (tab === "upcoming") {
        return p.status === "confirmed" && !isCancelled && !isEnded;
      }
      if (tab === "attended") {
        return p.status === "attended";
      }
      if (tab === "past") {
        return isCancelled || (p.status !== "attended" && isEnded);
      }

      return true;
    });
  }, [visiblePasses, search, tab, nowMs]);

  const handleConfirmWithdraw = async () => {
    if (!withdrawTarget) return;

    setIsWithdrawing(true);
    try {
      const res = await withdrawFromEvent(withdrawTarget.registrationId);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Withdrawal failed");

        return;
      }

      setWithdrawnIds((prev) => {
        const next = new Set(prev);

        next.add(withdrawTarget.registrationId);

        return next;
      });
      toast.info(`Withdrew from "${withdrawTarget.eventTitle}". Your spot was released.`);
      setWithdrawTarget(null);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";

      toast.danger(msg);
    } finally {
      setIsWithdrawing(false);
    }
  };

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
          <Chip color="accent" size="sm" variant="soft">
            {visiblePasses.length} Active {visiblePasses.length === 1 ? "Pass" : "Passes"}
          </Chip>
        }
        description="Access and present your official entry tickets and QR codes for campus student organization events."
        title="My Event Passes"
      />

      {visiblePasses.length > 0 ? (
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <SearchField
            aria-label="Search passes"
            className="w-full md:w-80"
            name="pass-search"
            value={search}
            onChange={setSearch}
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search by event, org, venue, or passcode…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <CatalogFilterDropdown
            filters={[
              {
                id: "status",
                label: "Pass Status",
                ariaLabel: "Filter event passes",
                value: tab,
                onChange: (val) => setTab(val as PassFilterTab),
                options: [
                  { id: "all", label: `All Passes (${visiblePasses.length})` },
                  { id: "upcoming", label: `Upcoming (${upcomingCount})` },
                  { id: "attended", label: `Attended (${attendedCount})` },
                  { id: "past", label: `Past & Cancelled (${pastCount})` },
                ],
              },
            ]}
          />
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((pass) => {
            const isCancelled = pass.eventStatus === "cancelled";
            const isAttended = pass.status === "attended";
            const deadlinePassed = pass.registrationDeadline
              ? nowMs > new Date(pass.registrationDeadline).getTime()
              : true;
            const canWithdraw = !isAttended && !isCancelled && !deadlinePassed;

            return (
              <Card
                key={pass.registrationId}
                className="h-full justify-between gap-3 border border-border/30 hover:border-accent/40 transition-colors bg-surface p-5"
              >
                <Card.Header className="flex flex-col gap-2.5 p-0">
                  <div className="flex items-center justify-between gap-2.5 w-full">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {pass.organizationLogoUrl ? (
                        <Avatar className="w-8 h-8 rounded-xl bg-accent/10 text-accent shrink-0">
                          <Avatar.Image
                            alt={pass.organizationName}
                            className="object-cover"
                            src={pass.organizationLogoUrl}
                          />
                          <Avatar.Fallback className="bg-accent/10 text-accent text-xs font-bold rounded-xl">
                            {pass.organizationAcronym.slice(0, 4)}
                          </Avatar.Fallback>
                        </Avatar>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                          {pass.organizationAcronym.slice(0, 4)}
                        </div>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">
                          {pass.organizationAcronym}
                        </span>
                        <span className="text-[11px] text-muted truncate">
                          {pass.organizationName}
                        </span>
                      </div>
                    </div>

                    <Chip
                      color={
                        isCancelled
                          ? "danger"
                          : isAttended
                            ? "accent"
                            : "success"
                      }
                      size="sm"
                      variant="soft"
                    >
                      {isCancelled ? (
                        <Ban className="mr-1 inline" size={12} />
                      ) : (
                        <CheckCircle2 className="mr-1 inline" size={12} />
                      )}
                      {isCancelled
                        ? "Cancelled"
                        : isAttended
                          ? "Attended"
                          : "Confirmed"}
                    </Chip>
                  </div>

                  <Card.Title className="text-base font-bold text-foreground line-clamp-2 leading-snug">
                    {pass.eventTitle}
                  </Card.Title>
                </Card.Header>

                <Card.Content className="p-0 pt-3 border-t border-border/20 flex flex-col gap-2 text-xs text-muted flex-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="text-accent shrink-0" size={13} />
                    <span className="truncate font-medium text-foreground">
                      {pass.venueName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-accent shrink-0" size={13} />
                    <span>
                      {new Date(pass.startTime).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}{" "}
                      ·{" "}
                      {new Date(pass.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {isAttended && pass.checkInAt ? (
                    <div className="flex items-center gap-2 text-accent font-medium">
                      <Clock className="shrink-0" size={13} />
                      <span>
                        Checked in at{" "}
                        {new Date(pass.checkInAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ) : null}

                  <div className="mt-auto pt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-muted">
                      Pass #{pass.qrToken.slice(0, 8).toUpperCase()}
                    </span>
                    <NextLink
                      className="inline-flex items-center gap-1 font-semibold text-accent hover:underline"
                      href={`/events/${pass.eventId}`}
                    >
                      Event Details <ArrowRight size={12} />
                    </NextLink>
                  </div>
                </Card.Content>

                <Card.Footer className="p-0 pt-3 flex items-center justify-between gap-2 border-t border-border/20">
                  {canWithdraw ? (
                    <Button
                      className="text-danger hover:bg-danger/10"
                      size="sm"
                      variant="ghost"
                      onPress={() => setWithdrawTarget(pass)}
                    >
                      <LogOut size={14} />
                      Withdraw
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted">
                      {isCancelled
                        ? "Event cancelled"
                        : isAttended
                          ? "Attendance recorded"
                          : "Deadline passed"}
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={isCancelled ? "secondary" : "primary"}
                    onPress={() => setActivePass(pass)}
                  >
                    <Ticket size={14} />
                    Show Pass
                  </Button>
                </Card.Footer>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border border-dashed border-border/60 bg-surface p-10 text-center items-center">
          <EmptyState className="flex flex-col items-center text-center gap-2">
            <Ticket className="text-muted size-10" />
            <h3 className="text-base font-semibold text-foreground">
              {visiblePasses.length === 0
                ? "No Confirmed Registrations"
                : "No Matching Passes"}
            </h3>
            <p className="text-xs text-muted max-w-sm">
              {visiblePasses.length === 0
                ? "You have not registered for any upcoming events yet. Explore the campus events directory and claim your pass!"
                : "No event passes matched your current search or filter tab."}
            </p>
            {visiblePasses.length === 0 ? (
              <NextLink href="/events">
                <Button className="mt-2" size="sm" variant="primary">
                  <Calendar size={15} />
                  Explore Events
                </Button>
              </NextLink>
            ) : null}
          </EmptyState>
        </Card>
      )}

      {/* Ticket Pass Modal */}
      {activePass ? (
        <DigitalTicketPass
          checkInAt={activePass.checkInAt}
          checkInMethod={activePass.checkInMethod}
          endTime={activePass.endTime}
          eventStatus={activePass.eventStatus}
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
      ) : null}

      {/* Withdrawal Confirmation AlertDialog */}
      <AlertDialog
        isOpen={!!withdrawTarget}
        onOpenChange={(open) => !open && !isWithdrawing && setWithdrawTarget(null)}
      >
        <AlertDialog.Backdrop variant="blur">
          <AlertDialog.Container size="sm">
            <AlertDialog.Dialog className="border border-warning/30 shadow-xl bg-surface">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="warning" />
                <AlertDialog.Heading>Withdraw Registration?</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Are you sure you want to withdraw from{" "}
                  <strong>{withdrawTarget?.eventTitle}</strong>? Your digital entry
                  pass will be invalidated and your spot will be released.
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer className="flex items-center justify-end gap-2">
                <Button
                  isDisabled={isWithdrawing}
                  size="sm"
                  variant="tertiary"
                  onPress={() => setWithdrawTarget(null)}
                >
                  Keep Pass
                </Button>
                <Button
                  isDisabled={isWithdrawing}
                  isPending={isWithdrawing}
                  size="sm"
                  variant="danger"
                  onPress={handleConfirmWithdraw}
                >
                  {isWithdrawing ? <Spinner color="current" size="sm" /> : null}
                  {isWithdrawing ? "Withdrawing..." : "Confirm Withdrawal"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
