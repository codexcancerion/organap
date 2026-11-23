"use client";

import type { CandidateProfile } from "../types";
import type { Key } from "@heroui/react";

import React from "react";
import {
  Alert,
  Avatar,
  Button,
  Chip,
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
  TextArea,
  TextField,
  toast,
} from "@heroui/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  ImagePlus,
  Plus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { ORGANIZATION_CATEGORIES, ORGANIZATION_CATEGORY_LABELS } from "../constants";
import {
  createOrganization,
  uploadOrganizationLogo,
} from "../services/organization_services";

import { CandidateAutocomplete } from "./candidate_autocomplete";
import {
  OrganizationLogoUploader,
  type CompressedLogoValue,
} from "./organization_logo_uploader";

// UI/UX FLOW: Keep step labels to single words ("Identity", "Leadership", "Logo") so wizard buttons never truncate.
const STEPS = [
  { id: 1, label: "Identity", icon: Building2 },
  { id: 2, label: "Leadership", icon: Users },
  { id: 3, label: "Logo", icon: ImagePlus },
] as const;

type WizardStep = 1 | 2 | 3;

export function CreateOrganizationModal({
  isOpen,
  onClose,
  candidates,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateProfile[];
  onCreated?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = React.useState<WizardStep>(1);
  const [name, setName] = React.useState("");
  const [acronym, setAcronym] = React.useState("");
  const [category, setCategory] = React.useState<string>("academic");
  const [description, setDescription] = React.useState("");
  const [governorId, setGovernorId] = React.useState("");
  const [adviserId, setAdviserId] = React.useState("");
  const [logoValue, setLogoValue] = React.useState<CompressedLogoValue | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetWizard = React.useCallback(() => {
    setStep(1);
    setName("");
    setAcronym("");
    setCategory("academic");
    setDescription("");
    setGovernorId("");
    setAdviserId("");
    setLogoValue(null);
  }, []);

  const handleClose = () => {
    if (isSubmitting) return;
    resetWizard();
    onClose();
  };

  const canProceedStep1 = Boolean(name.trim() && acronym.trim() && category);

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim() || !acronym.trim()) {
        toast.danger("Required fields missing", {
          description: "Please provide both an organization name and acronym.",
        });

        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleCategoryChange = (key: Key | Key[] | null) => {
    if (key != null && !Array.isArray(key)) {
      setCategory(String(key));
    }
  };

  const handleCreate = async () => {
    if (!canProceedStep1) {
      setStep(1);
      toast.danger("Required fields missing", {
        description: "Please provide the organization name, acronym, and category.",
      });

      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedLogoUrl: string | undefined;

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

        uploadedLogoUrl = uploadRes.data.publicUrl;
      }

      const res = await createOrganization({
        name,
        acronym,
        category,
        description,
        logoUrl: uploadedLogoUrl,
        governorId: governorId || null,
        adviserId: adviserId || null,
      });

      if (!res.success) {
        toast.danger("Failed to create organization", {
          description: res.error.message,
        });

        return;
      }

      toast.success("Organization created", {
        description: `Successfully recognized ${name.trim()} (${acronym.trim().toUpperCase()}).`,
      });
      resetWizard();
      onClose();
      if (onCreated) {
        onCreated();
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      toast.danger("Error creating organization", {
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedGovernor = React.useMemo(
    () => candidates.find((c) => c.id === governorId) ?? null,
    [candidates, governorId]
  );

  const selectedAdviser = React.useMemo(
    () => candidates.find((c) => c.id === adviserId) ?? null,
    [candidates, adviserId]
  );

  return (
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Modal.Backdrop variant="blur">
        <Modal.Container scroll="inside" size="lg">
          <Modal.Dialog className="border border-border/40 shadow-xl bg-surface max-h-[88dvh]">
            <Modal.CloseTrigger />
            <Modal.Header className="flex flex-col gap-4 pb-4 pr-8 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-accent/10 text-accent">
                  <Plus size={18} />
                </div>
                <div>
                  <Modal.Heading className="text-base font-bold text-foreground">
                    Register Student Organization
                  </Modal.Heading>
                  <p className="text-xs text-muted">
                    Step {step} of {STEPS.length} — {STEPS[step - 1].label}
                  </p>
                </div>
              </div>

              {/* 3-Step Wizard Progress Indicator */}
              <nav aria-label="Registration steps" className="grid grid-cols-3 gap-2 w-full">
                {STEPS.map((s) => {
                  const isCurrent = step === s.id;
                  const isCompleted = step > s.id;
                  const canJump = s.id < step || (s.id === 2 && canProceedStep1) || (s.id === 3 && canProceedStep1 && step >= 2);
                  const StepIcon = s.icon;

                  return (
                    <Button
                      key={s.id}
                      fullWidth
                      isDisabled={!canJump}
                      size="sm"
                      type="button"
                      variant={isCurrent ? "primary" : isCompleted ? "secondary" : "outline"}
                      onPress={() => canJump && setStep(s.id)}
                    >
                      {isCompleted ? <Check size={14} /> : <StepIcon size={14} />}
                      <span>{s.label}</span>
                    </Button>
                  );
                })}
              </nav>
            </Modal.Header>

            <Separator className="shrink-0" />

            <Form
              className="flex flex-col flex-1 min-h-0 overflow-hidden"
              validationBehavior="native"
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 3) {
                  handleNextStep();
                } else {
                  void handleCreate();
                }
              }}
            >
              <Modal.Body className="flex flex-col gap-4 py-4 px-1 flex-1 min-h-0 overflow-y-auto">
                {step === 1 ? (
                  <>
                    <TextField
                      isRequired
                      name="name"
                      value={name}
                      onChange={setName}
                    >
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

                    <TextField
                      name="description"
                      value={description}
                      onChange={setDescription}
                    >
                      <Label>Mission &amp; Description</Label>
                      <TextArea
                        placeholder="State the organization mission, focus, and student objectives…"
                        rows={3}
                      />
                      <Description>
                        Displayed on the organization catalog card and profile header.
                      </Description>
                    </TextField>
                  </>
                ) : null}

                {step === 2 ? (
                  <>
                    <Alert status="accent">
                      <Alert.Indicator />
                      <Alert.Content>
                        <Alert.Title>Optional Leadership Assignment</Alert.Title>
                        <Alert.Description>
                          Assign the Student Governor / President and Faculty Adviser now, or leave unassigned and configure them later from the organization page.
                        </Alert.Description>
                      </Alert.Content>
                    </Alert>

                    {/* WHY: Use concise labels without helper text below inputs; optionality is conveyed by placeholders, and disabledKeys blocks duplicate governor/adviser assignment. */}
                    <CandidateAutocomplete
                      candidates={candidates}
                      disabledKeys={adviserId ? [adviserId] : []}
                      label="Governor"
                      placeholder="Unassigned (Optional)"
                      searchPlaceholder="Search students by name, ID, or email…"
                      value={governorId}
                      onChange={setGovernorId}
                    />

                    <CandidateAutocomplete
                      candidates={candidates}
                      disabledKeys={governorId ? [governorId] : []}
                      label="Adviser"
                      placeholder="Unassigned (Optional)"
                      searchPlaceholder="Search faculty by name, ID, or email…"
                      value={adviserId}
                      onChange={setAdviserId}
                    />
                  </>
                ) : null}

                {step === 3 ? (
                  <>
                    <OrganizationLogoUploader
                      acronym={acronym}
                      organizationName={name}
                      value={logoValue}
                      onChange={setLogoValue}
                    />

                    <Surface className="rounded-2xl border border-border/40 bg-surface-secondary/50 p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-10 h-10 rounded-xl bg-accent/15 text-accent font-bold shrink-0">
                          {logoValue?.previewUrl ? (
                            <Avatar.Image
                              alt={name || acronym}
                              className="object-cover"
                              src={logoValue.previewUrl}
                            />
                          ) : null}
                          <Avatar.Fallback>
                            {(acronym || "ORG").slice(0, 3).toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">
                            {name.trim() || "Untitled Organization"} ({acronym.trim().toUpperCase() || "ORG"})
                          </span>
                          <span className="text-[11px] text-muted truncate">
                            Governor: {selectedGovernor?.fullName ?? "Unassigned"} · Adviser:{" "}
                            {selectedAdviser?.fullName ?? "Unassigned"}
                          </span>
                        </div>
                      </div>
                      <Chip className="shrink-0" color="accent" size="sm" variant="soft">
                        {ORGANIZATION_CATEGORY_LABELS[category] ?? category}
                      </Chip>
                    </Surface>
                  </>
                ) : null}
              </Modal.Body>

              <Modal.Footer className="shrink-0 flex items-center justify-between gap-2 pt-4 mt-2 border-t border-border/30">
                {step === 1 ? (
                  <Button
                    isDisabled={isSubmitting}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onPress={handleClose}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button
                    isDisabled={isSubmitting}
                    size="sm"
                    type="button"
                    variant="ghost"
                    onPress={() => setStep((prev) => (prev === 3 ? 2 : 1))}
                  >
                    <ArrowLeft size={14} />
                    Back
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    isDisabled={step === 1 && !canProceedStep1}
                    size="sm"
                    type="button"
                    variant="primary"
                    onPress={handleNextStep}
                  >
                    Next
                    <ArrowRight size={14} />
                  </Button>
                ) : (
                  <Button
                    isDisabled={!canProceedStep1 || isSubmitting}
                    isPending={isSubmitting}
                    size="sm"
                    type="button"
                    variant="primary"
                    onPress={handleCreate}
                  >
                    {isSubmitting ? <Spinner color="current" size="sm" /> : null}
                    {isSubmitting ? "Creating…" : "Create Organization"}
                  </Button>
                )}
              </Modal.Footer>
            </Form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
