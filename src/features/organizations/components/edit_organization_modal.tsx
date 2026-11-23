"use client";

import type { OrganizationListItem } from "../types";
import type { Key } from "@heroui/react";

type OrganizationSettingsTarget = Pick<
  OrganizationListItem,
  | "id"
  | "name"
  | "acronym"
  | "slug"
  | "category"
  | "description"
  | "logoUrl"
  | "isActive"
>;

import React from "react";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Modal,
  Select,
  Separator,
  Spinner,
  Surface,
  Switch,
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import { Settings, Trash2 } from "lucide-react";

import { ORGANIZATION_CATEGORIES } from "../constants";
import {
  updateOrganizationInfo,
  uploadOrganizationLogo,
} from "../services/organization_services";

import {
  OrganizationLogoUploader,
  type CompressedLogoValue,
} from "./organization_logo_uploader";

function OrganizationDangerSection({
  organizationName,
  onRequestDelete,
}: {
  organizationName: string;
  onRequestDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-danger">
          Danger Zone
        </h4>
        <p className="text-xs text-muted">
          Irreversible administrative actions for this organization.
        </p>
      </div>
      <Surface className="rounded-2xl border border-danger/30 bg-danger/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-foreground">
            Delete Organization
          </span>
          <span className="text-xs text-muted">
            Permanently remove {organizationName} and deactivate its campus profile.
          </span>
        </div>
        <Button
          className="shrink-0"
          size="sm"
          type="button"
          variant="danger"
          onPress={onRequestDelete}
        >
          <Trash2 size={14} />
          Delete Organization
        </Button>
      </Surface>
    </div>
  );
}

function EditOrganizationForm({
  organization,
  isSubmitting,
  setIsSubmitting,
  canDelete = false,
  onRequestDelete,
  onClose,
  onUpdated,
}: {
  organization: OrganizationSettingsTarget;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  canDelete?: boolean;
  onRequestDelete?: () => void;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [name, setName] = React.useState(organization.name);
  const [acronym, setAcronym] = React.useState(organization.acronym);
  const [category, setCategory] = React.useState(organization.category);
  const [description, setDescription] = React.useState(organization.description ?? "");
  const [isActive, setIsActive] = React.useState(organization.isActive);
  const [logoValue, setLogoValue] = React.useState<CompressedLogoValue | null>(null);
  const [isLogoCleared, setIsLogoCleared] = React.useState(false);

  const handleCategoryChange = (key: Key | Key[] | null) => {
    if (key != null && !Array.isArray(key)) {
      setCategory(String(key));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || !acronym.trim()) {
      toast.danger("Validation error", {
        description: "Organization name and acronym are required fields.",
      });

      return;
    }

    setIsSubmitting(true);
    try {
      let nextLogoUrl: string | null | undefined = isLogoCleared
        ? null
        : organization.logoUrl;

      if (logoValue?.blob) {
        const uploadRes = await uploadOrganizationLogo(
          logoValue.blob,
          acronym || name
        );

        if (!uploadRes.success) {
          toast.danger("Logo upload failed", {
            description: uploadRes.error.message,
          });

          return;
        }

        nextLogoUrl = uploadRes.data.publicUrl;
      }

      const res = await updateOrganizationInfo(organization.id, {
        name,
        acronym,
        slug: organization.slug,
        category,
        description,
        logoUrl: nextLogoUrl ?? "",
        isActive,
      });

      if (!res.success) {
        toast.danger("Failed to update organization", {
          description: res.error.message,
        });

        return;
      }

      toast.success("Organization updated", {
        description: "Organization details updated successfully.",
      });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      toast.danger("Error updating organization", {
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    /* WHY: Constrain Form as a flex-1 min-h-0 column so Modal.Body scrolls internally without pushing Header/Footer to dialog edges. */
    <Form
      className="flex flex-col flex-1 min-h-0 overflow-hidden"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Modal.Body className="flex flex-col gap-4 py-4 px-1 flex-1 min-h-0 overflow-y-auto">
        <TextField isRequired name="name" value={name} onChange={setName}>
          <Label>Organization Name</Label>
          <Input placeholder="e.g. Computer Science Society" />
          <FieldError />
        </TextField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <TextField
            isRequired
            name="acronym"
            value={acronym}
            onChange={(val) => setAcronym(val.toUpperCase())}
          >
            <Label>Acronym</Label>
            <Input maxLength={16} placeholder="e.g. CSS" />
            <FieldError />
          </TextField>

          <Select
            fullWidth
            isRequired
            name="category"
            placeholder="Select category"
            value={category}
            onChange={handleCategoryChange}
          >
            <Label>Category</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {ORGANIZATION_CATEGORIES.map((c) => (
                  <ListBox.Item key={c.value} id={c.value} textValue={c.label}>
                    {c.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <TextField name="description" value={description} onChange={setDescription}>
          <Label>Mission &amp; Description</Label>
          <TextArea
            placeholder="State the organization mission and objectives…"
            rows={3}
          />
        </TextField>

        <div className="flex flex-col gap-1.5">
          <Label>Organization Logo</Label>
          <OrganizationLogoUploader
            acronym={acronym}
            existingLogoUrl={organization.logoUrl}
            isLogoCleared={isLogoCleared}
            organizationName={name}
            value={logoValue}
            onChange={(val) => {
              setLogoValue(val);
              if (val) setIsLogoCleared(false);
            }}
            onClearExisting={() => setIsLogoCleared(true)}
          />
        </div>

        {/* INVARIANT: HeroUI v3 Switch expects Control inside Content beside Label so Description aligns below instead of inline. */}
        <Switch isSelected={isActive} onChange={setIsActive}>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label className="text-xs font-semibold">University Recognition Active</Label>
          </Switch.Content>
          <Description className="text-[11px]">
            Recognized organizations appear in campus catalogs and can submit proposals.
          </Description>
        </Switch>

        {canDelete && onRequestDelete ? (
          <>
            <Separator className="my-1" />
            <OrganizationDangerSection
              organizationName={organization.name}
              onRequestDelete={onRequestDelete}
            />
          </>
        ) : null}
      </Modal.Body>

      <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-4 mt-2 border-t border-border/30">
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
          isDisabled={!name.trim() || !acronym.trim() || isSubmitting}
          isPending={isSubmitting}
          size="sm"
          type="submit"
          variant="primary"
        >
          {isSubmitting ? <Spinner color="current" size="sm" /> : null}
          {isSubmitting ? "Saving…" : "Save Changes"}
        </Button>
      </Modal.Footer>
    </Form>
  );
}

export function EditOrganizationModal({
  isOpen,
  onClose,
  organization,
  onUpdated,
  canEdit = true,
  canDelete = false,
  onRequestDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  organization: OrganizationSettingsTarget;
  onUpdated: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onRequestDelete?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container scroll="inside" size="lg">
          <Modal.Dialog className="border border-border/40 shadow-xl bg-surface max-h-[88dvh]">
            <Modal.CloseTrigger />
            <Modal.Header className="shrink-0 pb-4 pr-8">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent shrink-0">
                  <Settings size={18} />
                </div>
                <div>
                  <Modal.Heading className="text-base font-bold text-foreground">
                    Organization Settings
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    Manage organization profile, logo, recognition status, and settings.
                  </p>
                </div>
              </div>
            </Modal.Header>

            <Separator className="shrink-0" />

            {/* INVARIANT: Keyed mount resets draft fields cleanly per open without violating react-hooks/set-state-in-effect. */}
            {isOpen && canEdit ? (
              <EditOrganizationForm
                key={organization.id}
                canDelete={canDelete}
                isSubmitting={isSubmitting}
                organization={organization}
                setIsSubmitting={setIsSubmitting}
                onClose={onClose}
                onRequestDelete={onRequestDelete}
                onUpdated={onUpdated}
              />
            ) : null}

            {isOpen && !canEdit ? (
              <>
                <Modal.Body className="flex flex-col gap-4 py-4 px-1 flex-1 min-h-0 overflow-y-auto">
                  {canDelete && onRequestDelete ? (
                    <OrganizationDangerSection
                      organizationName={organization.name}
                      onRequestDelete={onRequestDelete}
                    />
                  ) : null}
                </Modal.Body>
                <Modal.Footer className="shrink-0 flex items-center justify-end gap-2 pt-4 mt-2 border-t border-border/30">
                  <Button size="sm" type="button" variant="ghost" onPress={onClose}>
                    Close
                  </Button>
                </Modal.Footer>
              </>
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
