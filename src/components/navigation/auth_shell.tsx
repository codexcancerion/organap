"use client";

// Post-login app shell.
// - Left: Edge-docked Sidebar
// - Center: Centered main content
// - Right: RightPanel (hidden for now, preserved for future activation)
import * as React from "react";

import { RightPanelProvider } from "@/contexts/right_panel_context";

import { Sidebar } from "./sidebar";

export function AuthShell({
  children,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  unreadCount?: number;
}) {
  return (
    <RightPanelProvider>
      <div className="flex w-full min-h-[calc(100vh-5rem)] px-3 sm:px-4 py-4 gap-4 items-start justify-between">
        <Sidebar unreadCount={unreadCount} />
        <main className="flex-1 min-w-0 max-w-5xl mx-auto w-full flex flex-col">
          {children}
        </main>
      </div>
    </RightPanelProvider>
  );
}
