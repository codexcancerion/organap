"use client";

import React from "react";
import NextLink from "next/link";
import { Alert, Button, Card, Chip, Separator } from "@heroui/react";
import { ArrowLeft, Calendar, FileText, ShieldCheck } from "lucide-react";

import { PageHeader } from "./page_header";

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export type LegalDocumentShellProps = {
  badgeLabel: string;
  title: string;
  description: string;
  effectiveDate: string;
  noticeTitle: string;
  noticeDescription: string;
  sections: LegalSection[];
  siblingHref: string;
  siblingLabel: string;
};

export function LegalDocumentShell({
  badgeLabel,
  title,
  description,
  effectiveDate,
  noticeTitle,
  noticeDescription,
  sections,
  siblingHref,
  siblingLabel,
}: LegalDocumentShellProps) {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 flex flex-col gap-6 animate-fade-in">
      <PageHeader
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <NextLink href={siblingHref}>
              <Button size="sm" variant="secondary">
                <FileText size={14} />
                {siblingLabel}
              </Button>
            </NextLink>
            <NextLink href="/">
              <Button size="sm" variant="ghost">
                <ArrowLeft size={14} />
                Back to Home
              </Button>
            </NextLink>
          </div>
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            <ShieldCheck className="mr-1 inline" size={12} />
            {badgeLabel}
          </Chip>
        }
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: title },
        ]}
        description={description}
        meta={
          <span className="inline-flex items-center gap-1.5">
            <Calendar size={13} />
            Effective {effectiveDate}
          </span>
        }
        title={title}
      />

      <Alert status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{noticeTitle}</Alert.Title>
          <Alert.Description>{noticeDescription}</Alert.Description>
        </Alert.Content>
      </Alert>

      <Card className="border border-border/40 bg-surface p-6 sm:p-8 flex flex-col gap-6">
        {sections.map((section, idx) => (
          <React.Fragment key={section.id}>
            {idx > 0 ? <Separator /> : null}
            <section className="flex flex-col gap-2.5" id={section.id}>
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  className="text-sm text-foreground/85 leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 ? (
                <ul className="list-disc pl-5 flex flex-col gap-1.5 text-sm text-foreground/85 leading-relaxed">
                  {section.bullets.map((bullet, bIdx) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          </React.Fragment>
        ))}
      </Card>
    </div>
  );
}
