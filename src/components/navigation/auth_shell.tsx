"use client";

// Post-login 3-pane app shell derived from Voxsels.
// Restores the edge-to-edge 3-pane layout:
// - Left: Edge-docked Sidebar
// - Center: Centered main content
// - Right: Edge-docked RightPanel
import * as React from "react";
import { RightPanelProvider } from "@/contexts/right_panel_context";

import { Sidebar } from "./sidebar";
import { RightPanel } from "./right_panel";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <RightPanelProvider>
      <div className="flex w-full min-h-[calc(100vh-5rem)] px-2 sm:px-4 py-4 gap-4 justify-between">
        <Sidebar />
        <main className="flex-1 min-w-0 max-w-5xl mx-auto w-full flex flex-col">
          {children}
        </main>
        <RightPanel />
      </div>
    </RightPanelProvider>
  );
}
