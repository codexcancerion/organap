"use client";

import type { VenueListItem, VenuePermissions } from "../types";

import React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  SearchField,
  Tabs,
  toast,
} from "@heroui/react";
import {
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Settings,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";

import { deleteVenue } from "../services/venue_services";
import { DEFAULT_VENUE_PERMISSIONS } from "../types";

import { VenueIconBadge } from "./venue_icon_badge";
import { VenueModal } from "./venue_modal";

export type VenueCatalogProps = {
  venues: VenueListItem[];
  permissions?: VenuePermissions;
};

export function VenueCatalog({
  venues,
  permissions = DEFAULT_VENUE_PERMISSIONS,
}: VenueCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [venueToEdit, setVenueToEdit] = React.useState<VenueListItem | null>(null);
  const [venueToDelete, setVenueToDelete] = React.useState<VenueListItem | null>(null);

  const hasMaintenanceVenues = venues.some((v) => !v.isActive);
  const canOpenSettings = permissions.canChange || permissions.canDelete;

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return venues.filter((v) => {
      if (statusFilter === "available" && !v.isActive) return false;
      if (statusFilter === "maintenance" && v.isActive) return false;

      if (!q) return true;

      return (
        v.name.toLowerCase().includes(q) ||
        (v.location ?? "").toLowerCase().includes(q)
      );
    });
  }, [venues, search, statusFilter]);

  const handleOpenCreate = () => {
    setVenueToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenSettings = (venue: VenueListItem) => {
    setVenueToEdit(venue);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!venueToDelete) return;

    const res = await deleteVenue(venueToDelete.id);

    if (!res.success) {
      toast.danger("Failed to delete venue", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Venue deleted", {
      description: `Removed "${venueToDelete.name}" from campus venues.`,
    });
    setVenueToDelete(null);
    router.refresh();
  };

  const deleteHasLinkedEvents = Boolean(
    venueToDelete && venueToDelete.eventsCount > 0,
  );

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          permissions.canCreate ? (
            <Button size="md" variant="primary" onPress={handleOpenCreate}>
              <Plus size={16} />
              Add Venue
            </Button>
          ) : undefined
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {venues.length} {venues.length === 1 ? "Campus Venue" : "Campus Venues"}
          </Chip>
        }
        description="Explore authorized campus event facilities, seating capacities, locations, and linked activity schedules."
        title="Campus Venues"
      />

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SearchField
          aria-label="Search venues"
          className="w-full sm:w-80"
          name="venue-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by facility name or location…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        {(permissions.canViewInactive || hasMaintenanceVenues) ? (
          <Tabs
            selectedKey={statusFilter}
            variant="secondary"
            onSelectionChange={(key) => setStatusFilter(String(key))}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Filter venues by availability">
                <Tabs.Tab className="text-xs whitespace-nowrap" id="all">
                  All ({venues.length})
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="text-xs whitespace-nowrap" id="available">
                  Available ({venues.filter((v) => v.isActive).length})
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="text-xs whitespace-nowrap" id="maintenance">
                  Maintenance ({venues.filter((v) => !v.isActive).length})
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        ) : null}
      </div>

      {/* Venues Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((venue) => (
            <Card
              key={venue.id}
              className="relative group h-full justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
            >
              <Card.Header className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <VenueIconBadge
                      color={venue.color}
                      icon={venue.icon}
                      size="md"
                    />
                    <div className="flex flex-col min-w-0">
                      <Card.Title className="truncate group-hover:text-accent transition-colors">
                        {venue.name}
                      </Card.Title>
                      <Card.Description className="line-clamp-2 flex items-start gap-1">
                        {venue.location ? (
                          <>
                            <MapPin className="shrink-0 mt-0.5" size={12} />
                            <span>{venue.location}</span>
                          </>
                        ) : (
                          "Campus facility"
                        )}
                      </Card.Description>
                    </div>
                  </div>
                  <Chip
                    className="shrink-0"
                    color={venue.isActive ? "success" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {venue.isActive ? "Available" : "Maintenance"}
                  </Chip>
                </div>
              </Card.Header>

              <Card.Content className="flex flex-col items-start flex-1 text-xs text-muted">
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 w-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Users className="text-accent shrink-0" size={14} />
                    <span className="truncate">
                      <strong className="text-foreground font-semibold">
                        {venue.capacity}
                      </strong>{" "}
                      max capacity
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Clock className="text-accent shrink-0" size={14} />
                    <span className="truncate">
                      <strong className="text-foreground font-semibold">
                        {venue.upcomingEventsCount}
                      </strong>{" "}
                      upcoming
                    </span>
                  </div>
                  {canOpenSettings ? (
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar className="text-accent shrink-0" size={14} />
                      <span className="truncate">
                        {venue.eventsCount}{" "}
                        {venue.eventsCount === 1 ? "booking" : "bookings"}
                      </span>
                    </div>
                  ) : null}
                </div>
              </Card.Content>

              <Card.Footer className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                {canOpenSettings ? (
                  <Button
                    isIconOnly
                    aria-label={`Settings for ${venue.name}`}
                    className="relative z-10"
                    size="sm"
                    variant="ghost"
                    onPress={() => handleOpenSettings(venue)}
                  >
                    <Settings size={15} />
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <Calendar size={13} />
                    {venue.eventsCount}{" "}
                    {venue.eventsCount === 1 ? "booking" : "bookings"}
                  </span>
                )}
                <NextLink
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                  href={`/venues/${venue.id}`}
                >
                  View Details <ArrowRight size={13} />
                </NextLink>
              </Card.Footer>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center items-center gap-3">
          <EmptyState className="flex flex-col items-center text-center gap-2">
            <Building2 className="text-muted" size={32} />
            <span className="text-base font-semibold text-foreground">
              No Venues Found
            </span>
            <p className="text-xs text-muted max-w-md">
              {venues.length === 0
                ? "No campus venues have been registered yet."
                : "No campus event spaces matched your search or filter criteria."}
            </p>
            {permissions.canCreate && venues.length === 0 ? (
              <Button size="sm" variant="primary" onPress={handleOpenCreate}>
                <Plus size={15} />
                Add First Venue
              </Button>
            ) : null}
          </EmptyState>
        </Card>
      )}

      {(permissions.canCreate || canOpenSettings) ? (
        <VenueModal
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          isOpen={isModalOpen}
          venueToEdit={venueToEdit}
          onClose={() => {
            setIsModalOpen(false);
            setVenueToEdit(null);
          }}
          onRequestDelete={() => {
            if (!venueToEdit) return;
            setIsModalOpen(false);
            setVenueToDelete(venueToEdit);
          }}
        />
      ) : null}

      {permissions.canDelete ? (
        <ConfirmDeleteModal
          confirmLabel="Delete Venue"
          description={
            deleteHasLinkedEvents ? (
              <span>
                <strong>{venueToDelete?.name}</strong> is referenced by{" "}
                <strong>{venueToDelete?.eventsCount}</strong> event proposal
                {venueToDelete?.eventsCount === 1 ? "" : "s"}. Toggle its status to{" "}
                <strong>Maintenance</strong> in Venue Settings instead of deleting.
              </span>
            ) : (
              <span>
                Are you sure you want to permanently remove{" "}
                <strong>{venueToDelete?.name}</strong>? This action cannot be undone.
              </span>
            )
          }
          isConfirmDisabled={deleteHasLinkedEvents}
          isOpen={Boolean(venueToDelete)}
          title="Delete Venue"
          onClose={() => setVenueToDelete(null)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}
