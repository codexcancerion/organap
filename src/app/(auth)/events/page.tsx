import type { Metadata } from "next";

import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getEventsCatalog } from "@/features/events/services/event_queries";
import { EventExplorerClient } from "@/features/events/components/event_explorer_client";
import { EventsSkeleton } from "@/features/events/components/events_skeleton";

export const metadata: Metadata = {
  title: "Campus Events & Proposals | OrGanap",
  description: "Explore approved student organization events, campus workshops, and track proposal workflows.",
};

async function EventsContent({
  userId,
  canCreateProposal,
  initialView,
}: {
  userId: string;
  canCreateProposal: boolean;
  initialView: "events" | "calendar";
}) {
  const events = await getEventsCatalog(userId);

  return (
    <EventExplorerClient
      canCreateProposal={canCreateProposal}
      events={events}
      initialView={initialView}
    />
  );
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : undefined;
  const tab = resolvedParams?.tab;

  const canCreate =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("proposals.create");

  const initialView: "events" | "calendar" =
    tab === "calendar" ? "calendar" : "events";

  return (
    <Suspense fallback={<EventsSkeleton />}>
      <EventsContent
        canCreateProposal={canCreate}
        initialView={initialView}
        userId={user.id}
      />
    </Suspense>
  );
}
