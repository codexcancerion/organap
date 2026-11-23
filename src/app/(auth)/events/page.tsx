import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getEventsCatalog } from "@/features/events/services/event_queries";
import { EventExplorerClient } from "@/features/events/components/event_explorer_client";

export const metadata: Metadata = {
  title: "Campus Events & Proposals | OrGanap",
  description: "Explore approved student organization events, campus workshops, and track proposal workflows.",
};

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

  const events = await getEventsCatalog(user.id);

  const canCreate =
    user.isSuperuser ||
    user.isStaff ||
    user.permissions.includes("proposals.create");

  const initialView: "events" | "calendar" =
    tab === "calendar" ? "calendar" : "events";

  return (
    <EventExplorerClient
      canCreateProposal={canCreate}
      events={events}
      initialView={initialView}
    />
  );
}
