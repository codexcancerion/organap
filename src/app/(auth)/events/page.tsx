import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getApprovedEvents } from "@/features/events/services/event_queries";
import { EventExplorerClient } from "@/features/events/components/event_explorer_client";

export const metadata: Metadata = {
  title: "Campus Events | OrGanap",
  description: "Explore approved student organization events, workshops, and campus activities.",
};

export default async function EventsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const events = await getApprovedEvents(user.id);

  return <EventExplorerClient events={events} />;
}
