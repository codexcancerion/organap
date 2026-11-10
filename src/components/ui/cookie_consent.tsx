"use client";

import * as React from "react";
import { Button } from "@heroui/react";

export function CookieConsent() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const consent = localStorage.getItem("organap-cookie-consent");

    if (!consent) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("organap-cookie-consent", "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Privacy and cookies notification"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 p-4 rounded-2xl bg-surface border border-border shadow-xl text-sm flex flex-col gap-3 animate-fade-in"
    >
      <p className="text-foreground text-xs leading-relaxed">
        OrGanap uses essential cookies to authenticate your session and maintain secure event registration and attendance data.
      </p>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="primary" onClick={accept}>
          Acknowledge
        </Button>
      </div>
    </aside>
  );
}
