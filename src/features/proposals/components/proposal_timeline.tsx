"use client";

import React from "react";
import { Card, Chip } from "@heroui/react";
import { CheckCircle2, RotateCcw, XCircle, Shield, User } from "lucide-react";

export type TimelineReview = {
  id: string;
  stage: string;
  decision: string;
  remarks: string | null;
  reviewerName: string;
  reviewerSchoolId: string | null;
  createdAt: string;
};

export function ProposalTimeline({ reviews }: { reviews: TimelineReview[] }) {
  if (reviews.length === 0) {
    return (
      <Card className="border border-border/30 bg-surface p-5">
        <p className="text-xs text-muted italic">
          No formal reviews recorded yet. The proposal has not yet undergone adviser or Student Affairs assessment.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/40">
      {reviews.map((rev) => {
        const isEndorsed = rev.decision === "endorsed";
        const isApproved = rev.decision === "approved";
        const isReturned = rev.decision === "returned_for_revision";

        const icon = isApproved || isEndorsed ? (
          <CheckCircle2 size={16} />
        ) : isReturned ? (
          <RotateCcw size={16} />
        ) : (
          <XCircle size={16} />
        );

        const colorClass = isApproved || isEndorsed
          ? "bg-success/15 text-success border-success/30"
          : isReturned
            ? "bg-warning/15 text-warning border-warning/30"
            : "bg-danger/15 text-danger border-danger/30";

        const stageLabel = rev.stage === "adviser" ? "Faculty Adviser Review" : "Student Affairs Final Review";

        return (
          <div key={rev.id} className="relative flex items-start gap-4 pl-8">
            <div
              className={`absolute left-1.5 top-1 p-1 rounded-full border ${colorClass} bg-surface`}
            >
              {icon}
            </div>

            <Card className="w-full border border-border/30 bg-surface p-4 gap-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-foreground">
                    {stageLabel}
                  </span>
                  <Chip
                    className={colorClass}
                    size="sm"
                    variant="soft"
                  >
                    {rev.decision.replace(/_/g, " ").toUpperCase()}
                  </Chip>
                </div>
                <span className="text-[11px] text-muted font-mono">
                  {new Date(rev.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-muted">
                {rev.stage === "adviser" ? <User size={13} /> : <Shield size={13} />}
                <span>
                  {rev.reviewerName}
                  {rev.reviewerSchoolId && ` (${rev.reviewerSchoolId})`}
                </span>
              </div>

              {rev.remarks && (
                <div className="mt-1 p-2.5 rounded-xl bg-default/10 border border-border/20 text-xs text-foreground/90">
                  <p className="font-medium text-[11px] text-muted mb-0.5">Remarks:</p>
                  <p className="whitespace-pre-wrap">{rev.remarks}</p>
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
