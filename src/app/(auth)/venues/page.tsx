import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { getVenues } from "@/features/venues/services/venue_queries";
import { VenueCatalog } from "@/features/venues/components/venue_catalog";

export const metadata: Metadata = {
  title: "Campus Venues | OrGanap",
  description: "Browse authorized campus event spaces, capacity constraints, and facility booking schedules.",
};

export default async function VenuesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const venues = await getVenues();
  const permissions = {
    canViewInactive: user.isSuperuser || user.permissions.includes("venues.view"),
    canCreate: user.isSuperuser || user.permissions.includes("venues.create"),
    canChange: user.isSuperuser || user.permissions.includes("venues.change"),
    canDelete: user.isSuperuser || user.permissions.includes("venues.delete"),
  };

  return <VenueCatalog permissions={permissions} venues={venues} />;
}
