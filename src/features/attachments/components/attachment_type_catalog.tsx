"use client";

import type { CatalogFilterField } from "@/components/ui/catalog_filter_dropdown";
import type { AttachmentPermissions, AttachmentTypeItem } from "../types";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  Chip,
  EmptyState,
  SearchField,
  toast,
} from "@heroui/react";
import {
  Download,
  FileCheck2,
  Paperclip,
  Plus,
  Settings,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";
import { CatalogFilterDropdown } from "@/components/ui/catalog_filter_dropdown";
import { ConfirmDeleteModal } from "@/components/ui/confirm_delete_modal";

import { deleteAttachmentType } from "../services/attachment_services";

import { AttachmentTypeModal } from "./attachment_type_modal";

export type AttachmentTypeCatalogProps = {
  attachmentTypes: AttachmentTypeItem[];
  permissions: AttachmentPermissions;
};

type RequirementFilter = "all" | "required" | "optional";

export function AttachmentTypeCatalog({
  attachmentTypes,
  permissions,
}: AttachmentTypeCatalogProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<RequirementFilter>("all");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [itemToEdit, setItemToEdit] = React.useState<AttachmentTypeItem | null>(null);
  const [itemToDelete, setItemToDelete] = React.useState<AttachmentTypeItem | null>(null);

  const canOpenSettings = permissions.canChange || permissions.canDelete;

  const { requiredCount, optionalCount, uniqueCategories } = React.useMemo(() => {
    let required = 0;
    let optional = 0;
    const catSet = new Set<string>();

    for (const item of attachmentTypes) {
      if (item.isRequired) required += 1;
      else optional += 1;
      catSet.add(item.category?.trim() || "Others");
    }

    return {
      requiredCount: required,
      optionalCount: optional,
      uniqueCategories: Array.from(catSet),
    };
  }, [attachmentTypes]);

  const filterFields = React.useMemo<CatalogFilterField[]>(() => {
    const fields: CatalogFilterField[] = [
      {
        id: "requirement",
        label: "Requirement",
        ariaLabel: "Filter attachment types",
        value: filter,
        onChange: (val) => setFilter(val as RequirementFilter),
        options: [
          { id: "all", label: `All Types (${attachmentTypes.length})` },
          { id: "required", label: `Required (${requiredCount})` },
          { id: "optional", label: `Optional (${optionalCount})` },
        ],
      },
    ];

    if (uniqueCategories.length > 1) {
      fields.push({
        id: "category",
        label: "Category",
        ariaLabel: "Filter by attachment category",
        value: categoryFilter,
        onChange: setCategoryFilter,
        options: [
          { id: "all", label: "All Categories" },
          ...uniqueCategories.map((cat) => ({ id: cat, label: cat })),
        ],
      });
    }

    return fields;
  }, [
    attachmentTypes.length,
    categoryFilter,
    filter,
    optionalCount,
    requiredCount,
    uniqueCategories,
  ]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return attachmentTypes.filter((item) => {
      if (filter === "required" && !item.isRequired) return false;
      if (filter === "optional" && item.isRequired) return false;

      const resolvedCategory = item.category?.trim() || "Others";

      if (categoryFilter !== "all" && resolvedCategory !== categoryFilter) {
        return false;
      }

      if (!q) return true;

      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        resolvedCategory.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q)
      );
    });
  }, [attachmentTypes, search, filter, categoryFilter]);

  const handleOpenCreate = () => {
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenSettings = (item: AttachmentTypeItem) => {
    setItemToEdit(item);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    const res = await deleteAttachmentType(
      itemToDelete.id,
      itemToDelete.templateFilePath,
    );

    if (!res.success) {
      toast.danger("Failed to delete attachment type", {
        description: res.error.message,
      });

      return;
    }

    toast.success("Attachment type deleted", {
      description: `Removed "${itemToDelete.name}" (${itemToDelete.code}).`,
    });
    setItemToDelete(null);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          permissions.canCreate ? (
            <Button size="md" variant="primary" onPress={handleOpenCreate}>
              <Plus size={16} />
              Add Attachment Type
            </Button>
          ) : undefined
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {attachmentTypes.length}{" "}
            {attachmentTypes.length === 1 ? "Attachment Type" : "Attachment Types"}
          </Chip>
        }
        description="Configure dynamic file attachment requirements for student organization event proposals and submission guidelines."
        title="Event Attachment Types"
      />

      {/* Search & Requirement Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search attachment types"
          className="w-full md:w-80"
          name="attachment-type-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by name, code, or guideline…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        <CatalogFilterDropdown filters={filterFields} />
      </div>

      {/* Attachment Types Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((item) => (
            <Card key={item.id} className="h-full justify-between gap-3">
              <Card.Header className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                      {item.code.slice(0, 4)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <Card.Title className="truncate">{item.name}</Card.Title>
                      <Card.Description className="truncate font-mono text-[11px]">
                        {item.code}
                      </Card.Description>
                    </div>
                  </div>
                  <Chip
                    className="shrink-0"
                    color={item.isRequired ? "warning" : "default"}
                    size="sm"
                    variant="soft"
                  >
                    {item.isRequired ? "Required" : "Optional"}
                  </Chip>
                </div>
              </Card.Header>

              <Card.Content className="flex flex-col gap-2 text-xs text-muted flex-1">
                <p className="line-clamp-2 leading-relaxed">
                  {item.description || "No submission guidelines provided."}
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Chip color="default" size="sm" variant="soft">
                    {item.category?.trim() || "Others"}
                  </Chip>
                  <span className="text-[11px] font-medium text-foreground/80">
                    {item.isActive ? "Active on proposal forms" : "Inactive"}
                  </span>
                </div>
                {item.templateFileUrl ? (
                  <a
                    className="inline-flex items-center gap-1.5 w-fit text-[11px] font-semibold text-accent hover:underline"
                    download={item.templateFileName || undefined}
                    href={item.templateFileUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Download size={12} />
                    <span className="truncate max-w-52">
                      {item.templateFileName
                        ? `Template: ${item.templateFileName}`
                        : "Download Template"}
                    </span>
                  </a>
                ) : null}
              </Card.Content>

              <Card.Footer className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <FileCheck2 size={13} />
                  {item.submissionsCount}{" "}
                  {item.submissionsCount === 1 ? "file attached" : "files attached"}
                </span>

                {canOpenSettings ? (
                  <Button
                    isIconOnly
                    aria-label={`Settings for ${item.name}`}
                    className="ml-auto"
                    size="sm"
                    variant="ghost"
                    onPress={() => handleOpenSettings(item)}
                  >
                    <Settings size={15} />
                  </Button>
                ) : null}
              </Card.Footer>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-10 text-center items-center gap-3">
          <EmptyState className="flex flex-col items-center text-center gap-2">
            <Paperclip className="text-muted" size={32} />
            <span className="text-base font-semibold text-foreground">
              {attachmentTypes.length === 0
                ? "No Event Attachment Types Configured"
                : "No Matching Attachment Types"}
            </span>
            <p className="text-xs text-muted max-w-md">
              {attachmentTypes.length === 0
                ? "No dynamic attachment types have been added yet. Create your first requirement to display file upload slots on event proposal forms."
                : "No attachment types matched your search or filter criteria."}
            </p>
            {permissions.canCreate && attachmentTypes.length === 0 ? (
              <Button size="sm" variant="primary" onPress={handleOpenCreate}>
                <Plus size={15} />
                Add First Attachment Type
              </Button>
            ) : null}
          </EmptyState>
        </Card>
      )}

      {(permissions.canCreate || canOpenSettings) && (
        <AttachmentTypeModal
          attachmentTypeToEdit={itemToEdit}
          canDelete={permissions.canDelete}
          canEdit={permissions.canChange}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setItemToEdit(null);
          }}
          onRequestDelete={() => {
            if (!itemToEdit) return;
            setIsModalOpen(false);
            setItemToDelete(itemToEdit);
          }}
        />
      )}

      {permissions.canDelete && (
        <ConfirmDeleteModal
          confirmLabel="Delete Attachment Type"
          description={
            <>
              Are you sure you want to permanently delete{" "}
              <strong>
                {itemToDelete?.name} ({itemToDelete?.code})
              </strong>
              ? Existing uploaded proposal files will remain intact, but this requirement definition will be removed.
            </>
          }
          isOpen={Boolean(itemToDelete)}
          title="Delete Attachment Type"
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
