"use client";

import type { EventAttachment } from "@/types/domain";

import React from "react";
import { Card, Chip } from "@heroui/react";
import { ExternalLink, FileText, Paperclip } from "lucide-react";

import { formatFileSize, groupByAttachmentCategory } from "@/utils/formatters";

export type EventAttachmentsCardProps = {
  attachments: EventAttachment[];
  emptyMessage?: string;
};

/**
 * Shared attachments list card used across ProposalDetailView and EventDetailCard.
 */
export function EventAttachmentsCard({
  attachments,
  emptyMessage = "No attachments uploaded for this event.",
}: EventAttachmentsCardProps) {
  const groupedAttachments = React.useMemo(
    () =>
      groupByAttachmentCategory(
        attachments,
        (att) => att.attachmentTypeCategory,
      ),
    [attachments],
  );

  return (
    <Card className="border border-border/30 bg-surface p-6 gap-4">
      <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="text-primary size-5" />
          <h2 className="text-base font-bold text-foreground">Event Attachments</h2>
        </div>
        {attachments.length > 0 ? (
          <Chip size="sm" variant="soft">
            {attachments.length} {attachments.length === 1 ? "File" : "Files"}
          </Chip>
        ) : null}
      </div>

      {groupedAttachments.length > 0 ? (
        <div className="flex flex-col gap-4">
          {groupedAttachments.map((group) => (
            <div key={group.category} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                  {group.category}
                </h3>
                <span className="text-[11px] text-muted">
                  {group.items.length} {group.items.length === 1 ? "file" : "files"}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.items.map((att) => {
                  const sizeLabel = formatFileSize(att.sizeBytes);

                  return (
                    <a
                      key={att.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/30 bg-default/5 hover:border-accent/40 hover:bg-accent/5 transition-colors group"
                      href={att.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="text-accent shrink-0" size={16} />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                            {att.fileName}
                          </span>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted">
                            <span>{att.attachmentTypeName ?? "Supporting Document"}</span>
                            {att.uploadedByName ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>Uploaded by {att.uploadedByName}</span>
                              </>
                            ) : null}
                            {sizeLabel ? (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>{sizeLabel}</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {att.attachmentTypeCode ? (
                          <Chip size="sm" variant="soft">
                            {att.attachmentTypeCode}
                          </Chip>
                        ) : null}
                        <ExternalLink
                          className="text-muted group-hover:text-accent transition-colors"
                          size={14}
                        />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted">{emptyMessage}</p>
      )}
    </Card>
  );
}
