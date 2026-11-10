// Post-login app shell for OrGanap.
import React from "react";

import { Sidebar } from "./sidebar";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Sidebar />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
