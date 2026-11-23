"use client";

import type {
  InstitutionProfileSettings,
  ProposalPolicySettings,
  SemesterOption,
} from "../types";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Card,
  Chip,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Separator,
  Spinner,
  Switch,
  TextField,
  toast,
} from "@heroui/react";
import { Building, Lock, Save, SlidersHorizontal } from "lucide-react";

import { formatDateTime } from "@/utils/formatters";

import { saveInstitutionSettings } from "../services/settings_services";

const NO_SEMESTER_VALUE = "__none__";

export type InstitutionSettingsPanelProps = {
  userId: string;
  institutionProfile: InstitutionProfileSettings;
  proposalPolicy: ProposalPolicySettings;
  policyUpdatedAt: string | null;
  semesters: SemesterOption[];
  canManageSystemSettings: boolean;
};

export function InstitutionSettingsPanel({
  userId,
  institutionProfile,
  proposalPolicy,
  policyUpdatedAt,
  semesters,
  canManageSystemSettings,
}: InstitutionSettingsPanelProps) {
  const router = useRouter();
  const [institutionName, setInstitutionName] = React.useState(
    institutionProfile.institutionName,
  );
  const [studentAffairsOffice, setStudentAffairsOffice] = React.useState(
    institutionProfile.studentAffairsOffice,
  );
  const [supportEmail, setSupportEmail] = React.useState(
    institutionProfile.supportEmail,
  );
  const [activeSemesterId, setActiveSemesterId] = React.useState<string>(
    proposalPolicy.activeSemesterId ?? NO_SEMESTER_VALUE,
  );
  const [minLeadDays, setMinLeadDays] = React.useState(
    String(proposalPolicy.minLeadDays),
  );
  const [defaultVenueCapacity, setDefaultVenueCapacity] = React.useState(
    String(proposalPolicy.defaultVenueCapacity),
  );
  const [requireAdviserEndorsement, setRequireAdviserEndorsement] = React.useState(
    proposalPolicy.requireAdviserEndorsement,
  );
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canManageSystemSettings) return;

    const resolvedSemesterId =
      activeSemesterId === NO_SEMESTER_VALUE ? null : activeSemesterId;
    const matchedSemester = resolvedSemesterId
      ? semesters.find((s) => s.id === resolvedSemesterId)
      : null;

    setSaving(true);
    const res = await saveInstitutionSettings(
      userId,
      {
        institutionName,
        studentAffairsOffice,
        supportEmail,
      },
      {
        activeSemesterId: resolvedSemesterId,
        activeSemesterName: matchedSemester?.name ?? null,
        minLeadDays: Number(minLeadDays),
        requireAdviserEndorsement,
        defaultVenueCapacity: Number(defaultVenueCapacity),
      },
    );

    setSaving(false);

    if (!res.success) {
      toast.danger("Failed to update institutional settings", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Institutional settings saved", {
      description: "Campus parameters and proposal policy defaults have been updated.",
    });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      {!canManageSystemSettings ? (
        <Alert status="accent">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Read-Only Institutional Policy</Alert.Title>
            <Alert.Description>
              Viewing active campus event rules and Student Affairs contact defaults. Modifying institutional parameters requires the <code className="font-mono text-xs">settings.manage</code> permission.
            </Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Form
        className="flex flex-col gap-4"
        validationBehavior="native"
        onSubmit={handleSubmit}
      >
        <Card className="border border-border/40">
          <Card.Header className="flex flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Building size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <Card.Title className="text-base font-semibold">Institutional Identity</Card.Title>
                <Card.Description>
                  University and Student Affairs office details referenced across event workflows.
                </Card.Description>
              </div>
            </div>
            {!canManageSystemSettings ? (
              <Chip size="sm" variant="soft">
                <Lock className="mr-1 inline" size={11} />
                Read Only
              </Chip>
            ) : null}
          </Card.Header>

          <Card.Content className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                isRequired
                isReadOnly={!canManageSystemSettings}
                name="institutionName"
                value={institutionName}
                onChange={setInstitutionName}
              >
                <Label>Institution Name</Label>
                <Input placeholder="e.g. Saint Louis University" variant="secondary" />
                <FieldError />
              </TextField>

              <TextField
                isRequired
                isReadOnly={!canManageSystemSettings}
                name="studentAffairsOffice"
                value={studentAffairsOffice}
                onChange={setStudentAffairsOffice}
              >
                <Label>Student Affairs Office</Label>
                <Input placeholder="e.g. Office of Student Affairs" variant="secondary" />
                <FieldError />
              </TextField>
            </div>

            <TextField
              isReadOnly={!canManageSystemSettings}
              name="supportEmail"
              type="email"
              value={supportEmail}
              onChange={setSupportEmail}
            >
              <Label>Official OSAS Support Email</Label>
              <Input placeholder="osas@university.edu" variant="secondary" />
              <Description>Displayed for escalation and event permit inquiries.</Description>
              <FieldError />
            </TextField>
          </Card.Content>
        </Card>

        <Card className="border border-border/40">
          <Card.Header className="flex flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <SlidersHorizontal size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <Card.Title className="text-base font-semibold">
                  Term & Proposal Policies
                </Card.Title>
                <Card.Description>
                  Configure the active academic semester and institutional proposal defaults.
                </Card.Description>
              </div>
            </div>
            {policyUpdatedAt ? (
              <span className="text-[11px] text-muted shrink-0">
                Updated {formatDateTime(policyUpdatedAt)}
              </span>
            ) : null}
          </Card.Header>

          <Card.Content className="flex flex-col gap-4">
            {canManageSystemSettings && semesters.length > 0 ? (
              <Select
                fullWidth
                name="activeSemesterId"
                placeholder="Select active semester"
                value={activeSemesterId}
                variant="secondary"
                onChange={(val) => setActiveSemesterId(val ? String(val) : NO_SEMESTER_VALUE)}
              >
                <Label>Active Academic Semester</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id={NO_SEMESTER_VALUE} textValue="No semester pinned">
                      No active semester pinned
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {semesters.map((semester) => (
                      <ListBox.Item
                        key={semester.id}
                        id={semester.id}
                        textValue={semester.name}
                      >
                        {semester.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
                <Description>
                  Highlights the official current academic term across campus dashboards.
                </Description>
              </Select>
            ) : (
              <TextField
                isReadOnly
                name="activeSemesterReadonly"
                value={
                  semesters.find((s) => s.id === proposalPolicy.activeSemesterId)?.name ||
                  proposalPolicy.activeSemesterName ||
                  "Not configured"
                }
              >
                <Label>Active Academic Semester</Label>
                <Input readOnly variant="secondary" />
                {canManageSystemSettings && semesters.length === 0 ? (
                  <Description>
                    Create a semester under Institution → Semesters first to pin an active term.
                  </Description>
                ) : null}
              </TextField>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField
                isRequired
                isReadOnly={!canManageSystemSettings}
                name="minLeadDays"
                type="number"
                value={minLeadDays}
                onChange={setMinLeadDays}
              >
                <Label>Minimum Proposal Lead Time (Days)</Label>
                <Input max={365} min={0} variant="secondary" />
                <Description>Recommended days before event start date.</Description>
                <FieldError />
              </TextField>

              <TextField
                isRequired
                isReadOnly={!canManageSystemSettings}
                name="defaultVenueCapacity"
                type="number"
                value={defaultVenueCapacity}
                onChange={setDefaultVenueCapacity}
              >
                <Label>Default Venue Capacity</Label>
                <Input max={50000} min={1} variant="secondary" />
                <Description>Baseline capacity used when provisioning new venues.</Description>
                <FieldError />
              </TextField>
            </div>

            <Separator />

            <Switch
              isDisabled={!canManageSystemSettings}
              isSelected={requireAdviserEndorsement}
              onChange={setRequireAdviserEndorsement}
            >
              <Switch.Content>
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
                <Label className="text-sm font-medium">
                  Require Faculty Adviser Endorsement (FR-05)
                </Label>
              </Switch.Content>
              <Description>
                Enforce two-stage routing so submitted proposals pass adviser review before Student Affairs approval.
              </Description>
            </Switch>

            {canManageSystemSettings ? (
              <div className="flex justify-end pt-1">
                <Button
                  className="font-semibold"
                  isDisabled={saving}
                  type="submit"
                  variant="primary"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" />
                      Saving Policies…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save size={15} />
                      Save Institutional Settings
                    </span>
                  )}
                </Button>
              </div>
            ) : null}
          </Card.Content>
        </Card>
      </Form>
    </div>
  );
}
