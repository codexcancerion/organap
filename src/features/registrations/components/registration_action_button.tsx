"use client";

import React from "react";
import { AlertDialog, Button, Spinner, toast } from "@heroui/react";
import { LogOut, Ticket } from "lucide-react";
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
  registrationStatus?: "confirmed" | "attended";
  qrToken?: string;
  checkInAt?: string | null;
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
  registrationStatus = "confirmed",
  qrToken = "",
  checkInAt = null,
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
  const [isWithdrawConfirmOpen, setIsWithdrawConfirmOpen] = React.useState(false);

  const [optimistic, setOptimistic] = React.useState<
    | { type: "registered"; registrationId: string; qrToken: string }
    | { type: "withdrawn" }
    | null
  >(null);

  // WHY: Derive optimistic registration and withdrawal state directly from props instead of
  // syncing via useEffect so DigitalTicketPass opens immediately with the new qrToken without
  // triggering React 19 cascading-render warnings.
  const localReg = React.useMemo(() => {
    if (optimistic?.type === "registered" && !isRegistered) {
      return {
        isRegistered: true,
        registrationId: optimistic.registrationId,
        qrToken: optimistic.qrToken,
        status: "confirmed" as const,
        checkInAt: null,
      };
    }

    if (optimistic?.type === "withdrawn" && isRegistered) {
      return {
        isRegistered: false,
        registrationId: undefined,
        qrToken: "",
        status: "confirmed" as const,
        checkInAt: null,
      };
    }

    return {
      isRegistered,
      registrationId,
      qrToken,
      status: registrationStatus,
      checkInAt,
    };
  }, [
    optimistic,
    isRegistered,
    registrationId,
    qrToken,
    registrationStatus,
    checkInAt,
  ]);

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

      setOptimistic({
        type: "registered",
        registrationId: res.data.registrationId,
        qrToken: res.data.qrToken,
      });

      toast.success("Registration confirmed! Your digital entry pass is ready.");
      setIsPassModalOpen(true);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  const handleWithdraw = async () => {
    if (!localReg.registrationId) return;

    setIsPending(true);
    try {
      const res = await withdrawFromEvent(localReg.registrationId);

      if (!res.success) {
        toast.danger(res.error?.message ?? "Withdrawal failed");

        return;
      }

      setOptimistic({ type: "withdrawn" });
      setIsWithdrawConfirmOpen(false);
      toast.info("Your registration has been withdrawn. The spot has been released.");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";

      toast.danger(msg);
    } finally {
      setIsPending(false);
    }
  };

  if (localReg.isRegistered) {
    const isAttended = localReg.status === "attended";

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant="primary"
          onPress={() => setIsPassModalOpen(true)}
        >
          <Ticket size={15} />
          View Digital Pass
        </Button>

        {!isAttended && !deadlinePassed ? (
          <Button
            className="text-danger hover:bg-danger/10"
            isDisabled={isPending}
            size="sm"
            variant="ghost"
            onPress={() => setIsWithdrawConfirmOpen(true)}
          >
            <LogOut size={15} />
            Withdraw
          </Button>
        ) : null}

        <DigitalTicketPass
          checkInAt={localReg.checkInAt}
          endTime={endTime}
          eventTitle={eventTitle}
          isOpen={isPassModalOpen}
          organizationName={organizationName}
          qrToken={localReg.qrToken}
          schoolId={schoolId}
          startTime={startTime}
          status={localReg.status}
          studentName={studentName}
          venueName={venueName}
          onOpenChange={setIsPassModalOpen}
        />

        <AlertDialog
          isOpen={isWithdrawConfirmOpen}
          onOpenChange={(open) => !open && !isPending && setIsWithdrawConfirmOpen(false)}
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
                    Are you sure you want to withdraw from <strong>{eventTitle}</strong>? Your current digital pass will be invalidated and your reserved seat will be released immediately.
                  </p>
                </AlertDialog.Body>
                <AlertDialog.Footer className="flex items-center justify-end gap-2">
                  <Button
                    isDisabled={isPending}
                    size="sm"
                    variant="tertiary"
                    onPress={() => setIsWithdrawConfirmOpen(false)}
                  >
                    Keep Pass
                  </Button>
                  <Button
                    isDisabled={isPending}
                    isPending={isPending}
                    size="sm"
                    variant="danger"
                    onPress={handleWithdraw}
                  >
                    {isPending ? <Spinner color="current" size="sm" /> : null}
                    {isPending ? "Withdrawing..." : "Confirm Withdrawal"}
                  </Button>
                </AlertDialog.Footer>
              </AlertDialog.Dialog>
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog>
      </div>
    );
  }

  if (deadlinePassed) {
    return (
      <Button isDisabled size="sm" variant="secondary">
        Registration Closed
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button isDisabled size="sm" variant="secondary">
        Capacity Reached (Full)
      </Button>
    );
  }

  return (
    <Button
      isDisabled={isPending}
      isPending={isPending}
      size="sm"
      variant="primary"
      onPress={handleRegister}
    >
      {isPending ? <Spinner color="current" size="sm" /> : <Ticket size={15} />}
      {isPending ? "Confirming..." : "Register for Event"}
    </Button>
  );
}
