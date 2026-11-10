import React from "react";
import clsx from "clsx";

export type SectionProps = {
  children: React.ReactNode;
  className?: string;
  id?: string;
};

export function Section({ children, className, id }: SectionProps) {
  return (
    <section className={clsx("w-full py-8 md:py-12", className)} id={id}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        {children}
      </div>
    </section>
  );
}
