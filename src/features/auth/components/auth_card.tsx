// Shared shell for every auth flow page (login, register, forgot password).
import * as React from "react";
import { Card } from "@heroui/react";

export type AuthCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-md sm:max-w-lg flex-col items-center gap-4 mx-auto py-8">
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-muted text-sm font-medium leading-relaxed max-w-sm">
            {description}
          </p>
        ) : null}
      </div>
      <Card className="w-full shadow-lg border border-border/40">
        <Card.Content className="flex flex-col gap-4 p-6 sm:p-8">
          {children}
        </Card.Content>
        {footer ? (
          <Card.Footer className="flex flex-col items-start gap-2 border-t border-border/30 px-6 sm:px-8 py-4 bg-default/10">
            {footer}
          </Card.Footer>
        ) : null}
      </Card>
    </div>
  );
}
