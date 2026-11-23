import React from "react";
import NextLink from "next/link";
import { CalendarCheck2 } from "lucide-react";
import clsx from "clsx";

export function Logo({ className }: { className?: string }) {
  return (
    <NextLink
      className={clsx(
        "flex items-center gap-2.5 text-lg text-foreground hover:opacity-90 transition-opacity",
        className,
      )}
      href="/"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-accent text-accent-foreground shadow-sm">
        <CalendarCheck2 size={18} />
      </div>
      <span className="flex items-baseline font-logo font-normal uppercase tracking-wide leading-none text-xl">
        <span className="text-foreground">OR</span>
        <span className="text-accent">GANAP</span>
      </span>
    </NextLink>
  );
}
