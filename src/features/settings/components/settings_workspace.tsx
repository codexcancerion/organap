"use client";

import type { UserPreferences } from "@/types";
import type { SettingsPageData } from "../types";

import * as React from "react";
import NextLink from "next/link";
import { Button, Chip, Tabs } from "@heroui/react";
import { Bell, Building2, Palette, User } from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";

import { AppearanceSettingsPanel } from "./appearance_settings_panel";
import { InstitutionSettingsPanel } from "./institution_settings_panel";
import { NotificationsSettingsPanel } from "./notifications_settings_panel";

export function SettingsWorkspace({
  userId,
  data,
}: {
  userId: string;
  data: SettingsPageData;
}) {
  const [preferences, setPreferences] = React.useState<UserPreferences>(data.preferences);
  const prefKey = JSON.stringify(preferences);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          <NextLink href="/profile">
            <Button size="sm" variant="secondary">
              <User size={15} />
              Account Profile
            </Button>
          </NextLink>
        }
        badge={
          <Chip
            color={data.canManageSystemSettings ? "accent" : "default"}
            size="sm"
            variant="soft"
          >
            {data.canManageSystemSettings ? "Admin Access" : "Personal Workspace"}
          </Chip>
        }
        description="Customize your workspace appearance, notification preferences, and institutional event policies."
        title="Settings & Preferences"
      />

      <Tabs className="w-full" defaultSelectedKey="appearance" variant="secondary">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Settings sections">
            <Tabs.Tab className="text-xs sm:text-sm" id="appearance">
              <span className="inline-flex items-center gap-1.5">
                <Palette size={14} />
                Appearance
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>

            <Tabs.Tab className="text-xs sm:text-sm" id="notifications">
              <span className="inline-flex items-center gap-1.5">
                <Bell size={14} />
                Notifications
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>

            <Tabs.Tab className="text-xs sm:text-sm" id="institution">
              <span className="inline-flex items-center gap-1.5">
                <Building2 size={14} />
                Institutional
              </span>
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="pt-4" id="appearance">
          <AppearanceSettingsPanel
            preferences={preferences}
            userId={userId}
            onPreferencesSaved={setPreferences}
          />
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="notifications">
          <NotificationsSettingsPanel
            key={prefKey}
            preferences={preferences}
            unreadCount={data.unreadCount}
            userId={userId}
            onPreferencesSaved={setPreferences}
          />
        </Tabs.Panel>

        <Tabs.Panel className="pt-4" id="institution">
          <InstitutionSettingsPanel
            key={data.policyUpdatedAt ?? "institution-default"}
            canManageSystemSettings={data.canManageSystemSettings}
            institutionProfile={data.institutionProfile}
            policyUpdatedAt={data.policyUpdatedAt}
            proposalPolicy={data.proposalPolicy}
            semesters={data.semesters}
            userId={userId}
          />
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
