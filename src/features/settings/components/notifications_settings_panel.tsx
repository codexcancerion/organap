"use client";

import type { UserPreferences } from "@/types";

import * as React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  Description,
  Label,
  Separator,
  Spinner,
  Switch,
  toast,
} from "@heroui/react";
import { ArrowRight, Bell, CheckCheck, Save } from "lucide-react";

import {
  markAllNotificationsReadForUser,
  saveUserPreferences,
} from "../services/settings_services";

export type NotificationsSettingsPanelProps = {
  userId: string;
  preferences: UserPreferences;
  unreadCount: number;
  onPreferencesSaved: (next: UserPreferences) => void;
};

export function NotificationsSettingsPanel({
  userId,
  preferences,
  unreadCount,
  onPreferencesSaved,
}: NotificationsSettingsPanelProps) {
  const router = useRouter();
  const [draft, setDraft] = React.useState<UserPreferences>(preferences);
  const [saving, setSaving] = React.useState(false);
  const [markingRead, setMarkingRead] = React.useState(false);

  const handleSave = async () => {
    setSaving(true);
    const res = await saveUserPreferences(userId, draft);

    setSaving(false);

    if (!res.success) {
      toast.danger("Could not save notification preferences", {
        description: res.error.message,
      });

      return;
    }

    onPreferencesSaved(draft);
    toast.success("Notification preferences saved", {
      description: "Your campus alert channels have been updated.",
    });
    router.refresh();
  };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    const res = await markAllNotificationsReadForUser(userId);

    setMarkingRead(false);

    if (!res.success) {
      toast.danger("Failed to mark notifications read", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Inbox cleared", {
      description: "All notifications have been marked as read.",
    });
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="border border-border/40">
        <Card.Header className="flex flex-row items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Bell size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <Card.Title className="text-base font-semibold">Alert Channels (FR-11)</Card.Title>
              <Card.Description>
                Choose which proposal reviews, event schedule changes, and registration notices appear in your feed.
              </Card.Description>
            </div>
          </div>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <Switch
            isSelected={draft.proposalAlerts}
            onChange={(val) => setDraft((prev) => ({ ...prev, proposalAlerts: val }))}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="text-sm font-medium">Proposal & Review Updates</Label>
            </Switch.Content>
            <Description>
              Notify when proposals move between Adviser endorsement, Student Affairs review, or require revisions.
            </Description>
          </Switch>

          <Separator />

          <Switch
            isSelected={draft.eventReminders}
            onChange={(val) => setDraft((prev) => ({ ...prev, eventReminders: val }))}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="text-sm font-medium">Event Reminders & Cancellations</Label>
            </Switch.Content>
            <Description>
              Receive timely check-in alerts and immediate notices if an approved event is cancelled or rescheduled.
            </Description>
          </Switch>

          <Separator />

          <Switch
            isSelected={draft.emailNotifications}
            onChange={(val) => setDraft((prev) => ({ ...prev, emailNotifications: val }))}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="text-sm font-medium">Institutional Email Summaries</Label>
            </Switch.Content>
            <Description>
              Allow high-priority event pass receipts and official Student Affairs notices to be delivered by email.
            </Description>
          </Switch>

          <div className="flex justify-end pt-1">
            <Button
              className="font-semibold"
              isDisabled={saving}
              size="sm"
              type="button"
              variant="primary"
              onPress={handleSave}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <Spinner size="sm" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={15} />
                  Save Notification Preferences
                </span>
              )}
            </Button>
          </div>
        </Card.Content>
      </Card>

      <Card className="border border-border/40">
        <Card.Content className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Notifications Inbox</span>
              <Chip
                color={unreadCount > 0 ? "accent" : "default"}
                size="sm"
                variant="soft"
              >
                {unreadCount} unread
              </Chip>
            </div>
            <p className="text-xs text-muted">
              Inspect recent approval decisions, pass confirmations, and campus updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {unreadCount > 0 ? (
              <Button
                isDisabled={markingRead}
                size="sm"
                type="button"
                variant="secondary"
                onPress={handleMarkAllRead}
              >
                {markingRead ? <Spinner size="sm" /> : <CheckCheck size={14} />}
                Mark All Read
              </Button>
            ) : null}

            <NextLink href="/notifications">
              <Button size="sm" type="button" variant="primary">
                Open Inbox
                <ArrowRight size={14} />
              </Button>
            </NextLink>
          </div>
        </Card.Content>
      </Card>
    </div>
  );
}
