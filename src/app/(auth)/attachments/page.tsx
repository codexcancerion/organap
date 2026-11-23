import type { Metadata } from "next";

import { redirect } from "next/navigation";

import { AttachmentTypeCatalog } from "@/features/attachments/components/attachment_type_catalog";
import { getAttachmentTypes } from "@/features/attachments/services/attachment_queries";
import { getCurrentUser } from "@/features/auth/services/auth_queries";

export const metadata: Metadata = {
  title: "Event Attachment Types | OrGanap",
  description:
    "Configure dynamic file attachment requirements and guidelines for student organization event proposals.",
};

export default async function AttachmentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const canView =
    user.isSuperuser || user.permissions.includes("attachments.view");

  if (!canView) {
    redirect("/dashboard");
  }

  const attachmentTypes = await getAttachmentTypes();

  return (
    <AttachmentTypeCatalog
      attachmentTypes={attachmentTypes}
      permissions={{
        canView,
        canCreate:
          user.isSuperuser || user.permissions.includes("attachments.create"),
        canChange:
          user.isSuperuser || user.permissions.includes("attachments.change"),
        canDelete:
          user.isSuperuser || user.permissions.includes("attachments.delete"),
      }}
    />
  );
}
