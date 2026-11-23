// Domain and UI types for Venues feature in OrGanap.
export type { Venue } from "@/types/domain";

export type VenuePermissions = {
  canViewInactive: boolean;
  canCreate: boolean;
  canChange: boolean;
  canDelete: boolean;
};

export const DEFAULT_VENUE_PERMISSIONS: VenuePermissions = {
  canViewInactive: false,
  canCreate: false,
  canChange: false,
  canDelete: false,
};

export type VenueFormValues = {
  name: string;
  location?: string | null;
  capacity: number;
  isActive: boolean;
  icon: string;
  color: string;
};

export type VenueValidationResult =
  | { isValid: true }
  | { isValid: false; error: string };

export type VenueListItem = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  isActive: boolean;
  icon: string;
  color: string;
  eventsCount: number;
  upcomingEventsCount: number;
};

export type VenueLinkedEvent = {
  id: string;
  title: string;
  organizationId: string;
  organizationName: string;
  organizationAcronym: string;
  startTime: string;
  endTime: string;
  capacity: number;
  status: string;
};

export type VenueDetail = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  isActive: boolean;
  icon: string;
  color: string;
  events: VenueLinkedEvent[];
};
