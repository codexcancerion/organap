"use client";

import React from "react";
import { Button, toast } from "@heroui/react";
import { Ticket, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  registerForEvent,
  withdrawFromEvent,
} from "../services/registration_services";

import { DigitalTicketPass } from "./digital_ticket_pass";

export type RegistrationActionButtonProps = {
  eventId: string;
  isRegistered?: boolean;
  registrationId?: string;
  qrToken?: string;
  capacity: number;
  registeredCount: number;
  registrationDeadline: string;
  studentName?: string;
  schoolId?: string;
  eventTitle?: string;
  organizationName?: string;
  venueName?: string;
  startTime?: string;
  endTime?: string;
};

export function RegistrationActionButton({
  eventId,
  isRegistered = false,
  registrationId,
  qrToken = "",
  capacity,
  registeredCount,
  registrationDeadline,
  studentName = "Student Attendee",
  schoolId = "2026-STUDENT",
  eventTitle = "Campus Event",
  organizationName = "Student Group",
  venueName = "Campus Venue",
  startTime = "",
  endTime = "",
}: RegistrationActionButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [isPassModalOpen, setIsPassModalOpen] = React.useState(false);

  const isFull = registeredCount >= capacity;
  const deadlinePassed = new Date() > new Date(registrationDeadline);

  const handleRegister = async () => {
    setIsPending(true);
    try {
      const res = await registerForEvent(eventId);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Registration failed");

        return;
      }

      toast.success("Registration confirmed! Your digital entry pass is ready. 🎟️");
      router.refresh();
      setIsPassModalOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleWithdraw = async () => {
    if (!registrationId) return;

    setIsPending(true);
    try {
      const res = await withdrawFromEvent(registrationId);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Withdrawal failed");

        return;
      }

      toast.info("Your registration has been withdrawn. The spot has been released.");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="md"
          variant="primary"
          onClick={() => setIsPassModalOpen(true)}
        >
          <Ticket size={16} />
          View Digital Pass
        </Button>

        {!deadlinePassed && (
          <Button
            className="text-danger hover:bg-danger/10"
            isDisabled={isPending}
            size="md"
            variant="ghost"
            onClick={handleWithdraw}
          >
            <LogOut size={16} />
            Withdraw
          </Button>
        )}

        <DigitalTicketPass
          endTime={endTime}
          eventTitle={eventTitle}
          isOpen={isPassModalOpen}
          organizationName={organizationName}
          qrToken={qrToken}
          schoolId={schoolId}
          startTime={startTime}
          status="confirmed"
          studentName={studentName}
          venueName={venueName}
          onOpenChange={setIsPassModalOpen}
        />
      </div>
    );
  }

  if (deadlinePassed) {
    return (
      <Button isDisabled size="md" variant="secondary">
        Registration Closed
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button isDisabled size="md" variant="secondary">
        Capacity Reached (Full)
      </Button>
    );
  }

  return (
    <Button
      isDisabled={isPending}
      size="md"
      variant="primary"
      onClick={handleRegister}
    >
      <Ticket size={16} />
      {isPending ? "Confirming..." : "Register for Event"}
    </Button>
  );
}
