import type { Metadata } from "next";

import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getVenueById } from "@/features/venues/services/venue_queries";
import { VenueDetailView } from "@/features/venues/components/venue_detail_view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const venue = await getVenueById(id);

  return {
    title: venue ? `${venue.name} | Venues` : "Campus Venue",
    description: venue?.location ?? "Campus Facility Details",
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const venue = await getVenueById(id);

  if (!venue) {
    notFound();
  }

  const permissions = {
    canViewInactive: user.isSuperuser || user.permissions.includes("venues.view"),
    canCreate: user.isSuperuser || user.permissions.includes("venues.create"),
    canChange: user.isSuperuser || user.permissions.includes("venues.change"),
    canDelete: user.isSuperuser || user.permissions.includes("venues.delete"),
  };

  return <VenueDetailView permissions={permissions} venue={venue} />;
}
