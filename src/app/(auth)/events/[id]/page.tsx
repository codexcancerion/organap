import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getEventById } from "@/features/events/services/event_queries";
import { EventDetailCard } from "@/features/events/components/event_detail_card";
import { getEventRegistrationStatus } from "@/features/registrations/services/registration_queries";
import { RegistrationActionButton } from "@/features/registrations/components/registration_action_button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  return {
    title: event ? `${event.title} | Campus Events` : "Campus Event",
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const event = await getEventById(id, user.id);

  if (!event) {
    notFound();
  }

  const regStatus = await getEventRegistrationStatus(event.id, user.id);
  const isStaffOrSA = user.isSuperuser || user.isStaff;

  return (
    <EventDetailCard
      actionSlot={
        <RegistrationActionButton
          capacity={event.capacity}
          endTime={event.endTime}
          eventId={event.id}
          eventTitle={event.title}
          isRegistered={regStatus.isRegistered}
          organizationName={event.organizationName}
          registeredCount={event.registeredCount}
          registrationDeadline={event.registrationDeadline}
          registrationId={regStatus.registrationId}
          schoolId={user.schoolId ?? "N/A"}
          startTime={event.startTime}
          studentName={user.displayName ?? user.email}
          venueName={event.venueName}
        />
      }
      event={event}
      isStaffOrSA={isStaffOrSA}
    />
  );
}
