"use client";

import { useEffect } from "react";
import { Button } from "@heroui/react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root application error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 rounded-3xl bg-danger/10 text-danger mb-4">
        <AlertCircle size={32} />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
      <p className="text-muted text-sm max-w-sm mt-1 mb-6">
        An unexpected error occurred while loading this page.
      </p>
      <Button size="md" variant="primary" onClick={() => reset()}>
        <RotateCcw size={16} />
        Try Again
      </Button>
    </div>
  );
}
