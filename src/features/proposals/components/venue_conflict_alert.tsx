"use client";

import React from "react";
import { Alert } from "@heroui/react";
import { CheckCircle2 } from "lucide-react";

export function VenueConflictAlert({
  hasConflict,
  venueName,
}: {
  hasConflict: boolean;
  venueName: string;
}) {
  if (hasConflict) {
    return (
      <Alert className="border border-danger/30" status="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title className="font-semibold text-danger">
            Venue Conflict Detected
          </Alert.Title>
          <Alert.Description className="text-xs">
            Another approved event is already reserving <strong>{venueName}</strong> during this exact time window. Per institutional policy (FR-07), this proposal cannot receive final approval until the conflict is resolved or rescheduled.
          </Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-2xl border border-success/30 bg-success/10 text-xs text-success">
      <CheckCircle2 className="shrink-0" size={16} />
      <span>Venue <strong>{venueName}</strong> is verified available for this proposed schedule. No scheduling conflicts detected.</span>
    </div>
  );
}
