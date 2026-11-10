"use client";

import React from "react";
import { Chip } from "@heroui/react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileEdit,
  ShieldCheck,
  Ban,
} from "lucide-react";

export function ProposalStatusChip({ status }: { status: string }) {
  switch (status) {
    case "draft":
      return (
        <Chip color="default" size="sm" variant="soft">
          <FileEdit className="mr-1 inline" size={12} />
          Draft
        </Chip>
      );
    case "pending_adviser":
      return (
        <Chip className="bg-warning/15 text-warning border border-warning/30 font-medium" size="sm" variant="soft">
          <Clock className="mr-1 inline" size={12} />
          Pending Adviser
        </Chip>
      );
    case "pending_student_affairs":
      return (
        <Chip color="accent" size="sm" variant="soft">
          <ShieldCheck className="mr-1 inline" size={12} />
          Pending Student Affairs
        </Chip>
      );
    case "returned_by_adviser":
    case "returned_by_student_affairs":
      return (
        <Chip className="bg-warning/15 text-warning border border-warning/30 font-medium" size="sm" variant="soft">
          <AlertCircle className="mr-1 inline" size={12} />
          Needs Revision
        </Chip>
      );
    case "rejected_by_adviser":
    case "rejected_by_student_affairs":
      return (
        <Chip color="danger" size="sm" variant="soft">
          <XCircle className="mr-1 inline" size={12} />
          Rejected
        </Chip>
      );
    case "approved":
      return (
        <Chip color="success" size="sm" variant="soft">
          <CheckCircle2 className="mr-1 inline" size={12} />
          Approved
        </Chip>
      );
    case "cancelled":
      return (
        <Chip color="default" size="sm" variant="soft">
          <Ban className="mr-1 inline" size={12} />
          Cancelled
        </Chip>
      );
    default:
      return (
        <Chip color="default" size="sm" variant="soft">
          {status}
        </Chip>
      );
  }
}
