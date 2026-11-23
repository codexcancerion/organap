"use client";

import type { UserPreferences } from "@/types";

import * as React from "react";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import {
  Card,
  Chip,
  Description,
  Label,
  Switch,
  toast,
} from "@heroui/react";
import { Laptop, Moon, PanelLeft, Palette, Sun } from "lucide-react";

import { saveUserPreferences } from "../services/settings_services";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function subscribeSidebarCollapse(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("organap:sidebar-collapse", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("organap:sidebar-collapse", callback);
  };
}

function getSidebarCollapseSnapshot(): string | null {
  return localStorage.getItem("organap-sidebar-collapsed");
}

function getSidebarCollapseServerSnapshot(): string | null {
  return null;
}

const THEME_OPTIONS = [
  {
    id: "dark",
    label: "Dark Mode",
    description: "Low-glare dark interface (default).",
    icon: Moon,
  },
  {
    id: "light",
    label: "Light Mode",
    description: "High-contrast daytime daylight palette.",
    icon: Sun,
  },
  {
    id: "system",
    label: "System Match",
    description: "Follow your operating system theme.",
    icon: Laptop,
  },
] as const;

export type AppearanceSettingsPanelProps = {
  userId: string;
  preferences: UserPreferences;
  onPreferencesSaved: (next: UserPreferences) => void;
};

export function AppearanceSettingsPanel({
  userId,
  preferences,
  onPreferencesSaved,
}: AppearanceSettingsPanelProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const storedCollapsed = useSyncExternalStore(
    subscribeSidebarCollapse,
    getSidebarCollapseSnapshot,
    getSidebarCollapseServerSnapshot,
  );
  const [savingSidebar, setSavingSidebar] = React.useState(false);

  const compactSidebar =
    storedCollapsed === "true"
      ? true
      : storedCollapsed === "false"
        ? false
        : preferences.compactSidebarDefault;

  const activeTheme = isMounted ? (theme ?? "dark") : "dark";

  const handleThemeSelect = (nextTheme: string) => {
    setTheme(nextTheme);
    toast.success("Theme updated", {
      description: `Switched appearance to ${nextTheme === "system" ? "System Match" : nextTheme === "light" ? "Light Mode" : "Dark Mode"}.`,
    });
  };

  const handleSidebarDefaultChange = async (checked: boolean) => {
    localStorage.setItem("organap-sidebar-collapsed", String(checked));
    window.dispatchEvent(new CustomEvent("organap:sidebar-collapse", { detail: checked }));

    setSavingSidebar(true);
    const nextPrefs: UserPreferences = {
      ...preferences,
      compactSidebarDefault: checked,
    };
    const res = await saveUserPreferences(userId, nextPrefs);

    setSavingSidebar(false);

    if (!res.success) {
      toast.danger("Could not save layout preference", {
        description: res.error.message,
      });

      return;
    }

    onPreferencesSaved(nextPrefs);
    toast.success("Navigation preference saved", {
      description: checked
        ? "Sidebar will start collapsed in compact icon mode."
        : "Sidebar will start expanded by default.",
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="border border-border/40">
        <Card.Header className="flex flex-row items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Palette size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <Card.Title className="text-base font-semibold">Theme Appearance</Card.Title>
              <Card.Description>
                Choose how OrGanap surfaces, cards, and accent tokens render on your device.
              </Card.Description>
            </div>
          </div>
          {isMounted ? (
            <Chip color="accent" size="sm" variant="soft">
              Active: {resolvedTheme === "light" ? "Light" : "Dark"}
            </Chip>
          ) : null}
        </Card.Header>

        <Card.Content>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = activeTheme === option.id;

              return (
                <button
                  key={option.id}
                  aria-pressed={isSelected}
                  className={`flex flex-col items-start gap-2 rounded-2xl border p-3.5 text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "border-accent bg-accent/5"
                      : "border-border/40 hover:border-border bg-surface-secondary/30"
                  }`}
                  type="button"
                  onClick={() => handleThemeSelect(option.id)}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "bg-default/60 text-muted"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    {isSelected ? (
                      <Chip color="accent" size="sm" variant="soft">
                        Selected
                      </Chip>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {option.label}
                    </span>
                    <span className="text-xs text-muted leading-snug">
                      {option.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card.Content>
      </Card>

      <Card className="border border-border/40">
        <Card.Header className="flex flex-row items-start gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <PanelLeft size={18} />
          </div>
          <div className="flex flex-col gap-0.5">
            <Card.Title className="text-base font-semibold">Workspace Navigation</Card.Title>
            <Card.Description>
              Control persistent sidebar behavior across authenticated routes.
            </Card.Description>
          </div>
        </Card.Header>

        <Card.Content>
          <Switch
            isDisabled={savingSidebar}
            isSelected={compactSidebar}
            onChange={handleSidebarDefaultChange}
          >
            <Switch.Content>
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
              <Label className="text-sm font-medium">Collapse Sidebar by Default</Label>
            </Switch.Content>
            <Description>
              Keep the left navigation sidebar minimized to icons so content tables and calendars have extra horizontal width.
            </Description>
          </Switch>
        </Card.Content>
      </Card>
    </div>
  );
}
