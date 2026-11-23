"use client";

import React from "react";
import { Button, Surface } from "@heroui/react";
import { Trash2 } from "lucide-react";

export type DangerZoneSectionProps = {
  subtitle: string;
  actionTitle: string;
  actionDescription: React.ReactNode;
  buttonLabel: string;
  onAction: () => void;
};

/**
 * Shared Danger Zone block rendered inside entity Settings modals.
 */
export function DangerZoneSection({
  subtitle,
  actionTitle,
  actionDescription,
  buttonLabel,
  onAction,
}: DangerZoneSectionProps) {
  return (
    <div className="flex flex-col gap-2 pt-1">
      <div className="flex flex-col gap-0.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-danger">
          Danger Zone
        </h4>
        <p className="text-xs text-muted">{subtitle}</p>
      </div>
      <Surface className="rounded-2xl border border-danger/30 bg-danger/5 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-sm font-semibold text-foreground">
            {actionTitle}
          </span>
          <span className="text-xs text-muted">{actionDescription}</span>
        </div>
        <Button
          className="shrink-0"
          size="sm"
          type="button"
          variant="danger"
          onPress={onAction}
        >
          <Trash2 size={14} />
          {buttonLabel}
        </Button>
      </Surface>
    </div>
  );
}
