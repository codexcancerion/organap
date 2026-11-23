"use client";

import type { VenueFormValues } from "../types";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  Modal,
  Separator,
  Spinner,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { Check, Palette, Settings } from "lucide-react";
import clsx from "clsx";

import { DangerZoneSection } from "@/components/ui/danger_zone_section";

import {
  VENUE_COLOR_OPTIONS,
  VENUE_ICON_OPTIONS,
} from "../constants";
import {
  createVenue,
  updateVenue,
  validateVenueInput,
} from "../services/venue_services";

import { renderVenueGlyph, VenueIconBadge } from "./venue_icon_badge";

export type VenueEditableRecord = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  isActive: boolean;
  icon: string;
  color: string;
};

export type VenueModalProps = {
  isOpen: boolean;
  onClose: () => void;
  venueToEdit?: VenueEditableRecord | null;
  canEdit?: boolean;
  canDelete?: boolean;
  onRequestDelete?: () => void;
};

function VenueModalBodyContent({
  venueToEdit,
  canEdit,
  canDelete,
  onClose,
  onRequestDelete,
}: Omit<VenueModalProps, "isOpen">) {
  const router = useRouter();
  const isEditing = Boolean(venueToEdit);

  const [name, setName] = React.useState(venueToEdit?.name ?? "");
  const [location, setLocation] = React.useState(venueToEdit?.location ?? "");
  const [capacity, setCapacity] = React.useState(
    venueToEdit ? String(venueToEdit.capacity) : "50",
  );
  const [isActive, setIsActive] = React.useState(venueToEdit?.isActive ?? true);
  const [icon, setIcon] = React.useState(venueToEdit?.icon || "building-2");
  const [color, setColor] = React.useState(venueToEdit?.color || "accent");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: VenueFormValues = {
      name,
      location: location.trim() || null,
      capacity: Number(capacity),
      isActive,
      icon,
      color,
    };

    const validation = validateVenueInput(payload);

    if (!validation.isValid) {
      toast.danger("Validation error", { description: validation.error });

      return;
    }

    setIsSubmitting(true);
    try {
      const res =
        isEditing && venueToEdit
          ? await updateVenue(venueToEdit.id, payload)
          : await createVenue(payload);

      if (!res.success) {
        toast.danger(
          isEditing ? "Failed to update venue" : "Failed to create venue",
          { description: res.error.message },
        );

        return;
      }

      toast.success(isEditing ? "Venue updated" : "Venue created", {
        description: isEditing
          ? `Updated ${name.trim()}.`
          : `Added ${name.trim()} to campus venues.`,
      });
      onClose();
      router.refresh();
    } catch (err: unknown) {
      toast.danger("Unexpected error", {
        description: err instanceof Error ? err.message : "Could not save venue.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal.Dialog className="border border-border/40 shadow-lg bg-surface flex flex-col max-h-[90vh]">
      <Modal.CloseTrigger />
      <Modal.Header className="shrink-0">
        <div className="flex items-start gap-3">
          {isEditing ? (
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Settings size={18} />
            </div>
          ) : (
            <VenueIconBadge color={color} icon={icon} size="md" />
          )}
          <div>
            <Modal.Heading>
              {isEditing ? "Venue Settings" : "Add Campus Venue"}
            </Modal.Heading>
            <p className="text-xs text-muted">
              {isEditing
                ? "Update facility details, icon & color badge, availability status, and administrative actions."
                : "Register a campus facility with capacity limits, status, and an icon badge."}
            </p>
          </div>
        </div>
      </Modal.Header>

      {!isEditing || canEdit ? (
        <Form
          className="flex flex-col flex-1 min-h-0 overflow-hidden"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <Modal.Body className="flex flex-col gap-4 py-3 overflow-y-auto flex-1 min-h-0">
            {/* Facility Inputs */}
            <TextField
              isRequired
              name="name"
              validate={(val) => {
                if (!val || val.trim().length < 2) {
                  return "Venue name must be at least 2 characters.";
                }

                return null;
              }}
              value={name}
              onChange={setName}
            >
              <Label>Venue Name</Label>
              <Input
                placeholder="e.g. University Main Auditorium"
                variant="secondary"
              />
              <FieldError />
            </TextField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                name="location"
                value={location}
                onChange={setLocation}
              >
                <Label>Location / Building</Label>
                <Input
                  placeholder="e.g. Main Academic Building, 4th Floor"
                  variant="secondary"
                />
                <FieldError />
              </TextField>

              <TextField
                isRequired
                name="capacity"
                type="number"
                validate={(val) => {
                  const num = Number(val);

                  if (!Number.isInteger(num) || num < 1) {
                    return "Capacity must be a positive whole number.";
                  }

                  return null;
                }}
                value={capacity}
                onChange={setCapacity}
              >
                <Label>Max Capacity</Label>
                <Input max={100000} min={1} variant="secondary" />
                <FieldError />
              </TextField>
            </div>

            <Switch isSelected={isActive} onChange={setIsActive}>
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="text-sm font-medium">
                  Available for Event Proposals
                </Label>
              </Switch.Content>
              <Description>
                Toggle off to place this facility under Maintenance and hide it from active proposal booking.
              </Description>
            </Switch>

            <Separator />

            {/* Icon & Color Appearance */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <VenueIconBadge color={color} icon={icon} size="sm" />
                  <span className="text-xs font-semibold text-foreground">
                    Icon & Color
                  </span>
                </div>
                <span className="text-[11px] text-muted font-mono">
                  {VENUE_COLOR_OPTIONS.find((c) => c.id === color)?.label ?? color}
                </span>
              </div>

              {/* Icon Picker */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted">
                  Choose Icon
                </span>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {VENUE_ICON_OPTIONS.map((opt) => {
                    const isSelected = icon === opt.id;

                    return (
                      <button
                        key={opt.id}
                        aria-label={opt.label}
                        aria-pressed={isSelected}
                        className={clsx(
                          "h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer",
                          isSelected
                            ? "border-accent bg-accent/12 text-accent"
                            : "border-border/40 text-muted hover:text-foreground hover:border-border",
                        )}
                        title={opt.label}
                        type="button"
                        onClick={() => setIcon(opt.id)}
                      >
                        {renderVenueGlyph(opt.id, 16)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Swatches */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted inline-flex items-center gap-1.5">
                  <Palette size={13} />
                  Choose Color
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  {VENUE_COLOR_OPTIONS.map((c) => {
                    const isSelected = color === c.id;

                    return (
                      <button
                        key={c.id}
                        aria-label={`Color ${c.label}`}
                        aria-pressed={isSelected}
                        className={clsx(
                          "w-7 h-7 rounded-full flex items-center justify-center transition-transform cursor-pointer border-2",
                          c.swatchClass,
                          isSelected
                            ? "border-foreground scale-110"
                            : "border-transparent hover:scale-105",
                        )}
                        title={c.label}
                        type="button"
                        onClick={() => setColor(c.id)}
                      >
                        {isSelected ? (
                          <Check className="text-white" size={13} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {isEditing && venueToEdit && canDelete && onRequestDelete ? (
              <>
                <Separator className="my-1" />
                <DangerZoneSection
                  actionDescription={`Permanently remove ${venueToEdit.name}.`}
                  actionTitle="Delete Venue"
                  buttonLabel="Delete Venue"
                  subtitle="Irreversible administrative actions for this campus facility."
                  onAction={onRequestDelete}
                />
              </>
            ) : null}
          </Modal.Body>

          <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-3 border-t border-border/30">
            <Button
              isDisabled={isSubmitting}
              size="sm"
              type="button"
              variant="ghost"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              isDisabled={isSubmitting || name.trim().length < 2}
              size="sm"
              type="submit"
              variant="primary"
            >
              {isSubmitting ? (
                <Spinner color="current" size="sm" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Venue"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      ) : (
        <>
          <Modal.Body className="flex flex-col gap-4 py-3 overflow-y-auto flex-1 min-h-0">
            {venueToEdit && canDelete && onRequestDelete ? (
              <DangerZoneSection
                actionDescription={`Permanently remove ${venueToEdit.name}.`}
                actionTitle="Delete Venue"
                buttonLabel="Delete Venue"
                subtitle="Irreversible administrative actions for this campus facility."
                onAction={onRequestDelete}
              />
            ) : null}
          </Modal.Body>
          <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-3 border-t border-border/30">
            <Button size="sm" type="button" variant="ghost" onPress={onClose}>
              Close
            </Button>
          </Modal.Footer>
        </>
      )}
    </Modal.Dialog>
  );
}

export function VenueModal({
  isOpen,
  onClose,
  venueToEdit,
  canEdit = true,
  canDelete = false,
  onRequestDelete,
}: VenueModalProps) {
  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container scroll="inside" size="lg">
          {isOpen ? (
            <VenueModalBodyContent
              key={venueToEdit ? `${venueToEdit.id}-${venueToEdit.name}-${venueToEdit.icon}-${venueToEdit.color}-${String(venueToEdit.isActive)}` : "create-venue"}
              canDelete={canDelete}
              canEdit={canEdit}
              venueToEdit={venueToEdit}
              onClose={onClose}
              onRequestDelete={onRequestDelete}
            />
          ) : null}
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
