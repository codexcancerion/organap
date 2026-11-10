import type { Metadata } from "next";

import { redirect } from "next/navigation";
import { Card } from "@heroui/react";
import { Bell, Shield, Palette } from "lucide-react";

import { getCurrentUser } from "@/features/auth/services/auth_queries";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { PageHeader } from "@/components/layout/page_header";

export const metadata: Metadata = {
  title: "Settings",
  description: "Configure your application preferences.",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl">
      <PageHeader
        description="Customize your interface appearance and notification behavior."
        title="Preferences & Settings"
      />

      <div className="flex flex-col gap-4">
        <Card className="border border-border/40 p-5">
          <Card.Content className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Theme Appearance</h2>
                <p className="text-xs text-muted">Switch between dark and light color modes</p>
              </div>
            </div>
            <ThemeSwitch />
          </Card.Content>
        </Card>

        <Card className="border border-border/40 p-5">
          <Card.Content className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">In-App Notifications</h2>
                <p className="text-xs text-muted">Proposal reviews and event alerts (FR-11)</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-accent uppercase">Enabled</span>
          </Card.Content>
        </Card>

        <Card className="border border-border/40 p-5">
          <Card.Content className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                <Shield size={20} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Account Access & Groups</h2>
                <p className="text-xs text-muted">Governed by dynamic campus groups and permissions</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-muted uppercase">
              {user.isSuperuser
                ? "Superuser"
                : user.groups.length
                  ? user.groups.join(", ")
                  : "Standard Member"}
            </span>
          </Card.Content>
        </Card>
      </div>
    </div>
  );
}
