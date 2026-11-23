"use client";

import type { CandidateProfile, OrganizationListItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  ListBox,
  SearchField,
  Select,
} from "@heroui/react";
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { PageHeader } from "@/components/layout/page_header";

import { ORGANIZATION_CATEGORY_LABELS } from "../constants";

import { CreateOrganizationModal } from "./create_organization_modal";
import { DeleteOrganizationModal } from "./delete_organization_modal";
import { EditOrganizationModal } from "./edit_organization_modal";

const CATEGORY_FILTER_LABELS: Record<string, string> = {
  all: "All Categories",
  ...ORGANIZATION_CATEGORY_LABELS,
};

export function OrganizationCatalog({
  organizations,
  canCreate = false,
  candidates = [],
  currentUserId = null,
  canUpdateAll = false,
  canUpdateOwn = false,
  canDelete = false,
}: {
  organizations: OrganizationListItem[];
  canCreate?: boolean;
  candidates?: CandidateProfile[];
  currentUserId?: string | null;
  canUpdateAll?: boolean;
  canUpdateOwn?: boolean;
  canDelete?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [orgForSettings, setOrgForSettings] = React.useState<OrganizationListItem | null>(null);
  const [orgToDelete, setOrgToDelete] = React.useState<OrganizationListItem | null>(null);

  const categories = React.useMemo(() => {
    const set = new Set<string>();

    organizations.forEach((o) => {
      if (o.category) set.add(o.category);
    });

    return ["all", ...Array.from(set)];
  }, [organizations]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return organizations.filter((org) => {
      const matchSearch =
        !q ||
        org.name.toLowerCase().includes(q) ||
        org.acronym.toLowerCase().includes(q) ||
        (org.description ?? "").toLowerCase().includes(q);

      const matchCategory =
        selectedCategory === "all" || org.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [organizations, search, selectedCategory]);

  const getOrgPermissions = (org: OrganizationListItem) => {
    const isOwnLeader = Boolean(
      currentUserId &&
        (org.governor?.id === currentUserId || org.adviser?.id === currentUserId),
    );
    const canEditOrg = canUpdateAll || (isOwnLeader && canUpdateOwn) || isOwnLeader;

    return {
      canEditOrg,
      canDeleteOrg: canDelete,
      canOpenSettings: canEditOrg || canDelete,
    };
  };

  const settingsOrgPerms = orgForSettings ? getOrgPermissions(orgForSettings) : null;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      <PageHeader
        actions={
          canCreate ? (
            <Button
              size="md"
              variant="primary"
              onPress={() => setIsCreateModalOpen(true)}
            >
              <Plus size={16} />
              Register Organization
            </Button>
          ) : undefined
        }
        badge={
          <Chip color="accent" size="sm" variant="soft">
            {organizations.length} Recognized Groups
          </Chip>
        }
        description="Browse recognized student bodies, departmental academic societies, and campus clubs with their governors, advisers, and schedules."
        title="Student Organizations"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <SearchField
          aria-label="Search organizations"
          className="w-full md:w-80"
          name="org-search"
          value={search}
          onChange={setSearch}
        >
          <SearchField.Group>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder="Search by name, acronym, or focus…" />
            <SearchField.ClearButton />
          </SearchField.Group>
        </SearchField>

        {/* Category Filter Dropdown */}
        <Select
          aria-label="Filter organizations by category"
          className="w-full md:w-56"
          value={selectedCategory}
          onChange={(val) => setSelectedCategory(val ? String(val) : "all")}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {categories.map((cat) => {
                const label = CATEGORY_FILTER_LABELS[cat] ?? cat;

                return (
                  <ListBox.Item key={cat} id={cat} textValue={label}>
                    {label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                );
              })}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Organizations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
        {filtered.map((org) => {
          const { canOpenSettings } = getOrgPermissions(org);

          return (
            <Card
              key={org.id}
              className="relative group h-full justify-between gap-3 hover:border-accent/40 transition-colors cursor-pointer"
            >
              <Card.Header className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {org.logoUrl ? (
                      <Avatar className="w-10 h-10 rounded-xl bg-accent/10 text-accent shrink-0">
                        <Avatar.Image
                          alt={org.name}
                          className="object-cover"
                          src={org.logoUrl}
                        />
                        <Avatar.Fallback className="bg-accent/10 text-accent text-xs font-bold rounded-xl">
                          {org.acronym.slice(0, 4)}
                        </Avatar.Fallback>
                      </Avatar>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0 font-bold text-xs">
                        {org.acronym.slice(0, 4)}
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <Card.Title className="truncate group-hover:text-accent transition-colors">
                        {org.acronym}
                      </Card.Title>
                      <Card.Description className="truncate">
                        {org.name}
                      </Card.Description>
                    </div>
                  </div>
                  <Chip
                    className="capitalize shrink-0 text-[10px] font-medium"
                    size="sm"
                    variant="soft"
                  >
                    {CATEGORY_FILTER_LABELS[org.category] ?? org.category}
                  </Chip>
                </div>
              </Card.Header>

              <Card.Content className="flex flex-col gap-2.5">
                {org.description ? (
                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {org.description}
                  </p>
                ) : null}

                {/* Leadership Snippet */}
                <div className="grid grid-cols-1 gap-1 text-xs text-muted">
                  <div className="flex items-center gap-2 truncate">
                    <ShieldCheck className="text-accent shrink-0" size={13} />
                    <span className="truncate">
                      Governor:{" "}
                      <strong className="text-foreground font-medium">
                        {org.governor?.fullName ?? "Unassigned"}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 truncate">
                    <GraduationCap className="text-accent shrink-0" size={13} />
                    <span className="truncate">
                      Adviser:{" "}
                      <strong className="text-foreground font-medium">
                        {org.adviser?.fullName ?? "Unassigned"}
                      </strong>
                    </span>
                  </div>
                </div>
              </Card.Content>

              <Card.Footer className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
                {canOpenSettings ? (
                  <Button
                    isIconOnly
                    aria-label={`Settings for ${org.name}`}
                    className="relative z-10"
                    size="sm"
                    variant="ghost"
                    onPress={() => setOrgForSettings(org)}
                  >
                    <Settings size={15} />
                  </Button>
                ) : (
                  <span className="text-xs text-muted">{org.acronym}</span>
                )}

                <NextLink
                  className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform after:absolute after:inset-0 after:content-['']"
                  href={`/organizations/${org.id}`}
                >
                  View Details <ArrowRight size={13} />
                </NextLink>
              </Card.Footer>
            </Card>
          );
        })}

        {filtered.length === 0 ? (
          <Card className="col-span-full border border-dashed border-border/60 bg-surface/40 p-10 rounded-3xl">
            <EmptyState className="flex flex-col items-center text-center gap-2">
              <Building2 className="text-muted" size={32} />
              <span className="text-base font-semibold text-foreground">
                No organizations found
              </span>
              <p className="text-xs text-muted max-w-sm">
                We couldn&apos;t find any student organizations matching your search criteria.
              </p>
            </EmptyState>
          </Card>
        ) : null}
      </div>

      {canCreate ? (
        <CreateOrganizationModal
          candidates={candidates}
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      ) : null}

      {orgForSettings && settingsOrgPerms?.canOpenSettings ? (
        <EditOrganizationModal
          canDelete={settingsOrgPerms.canDeleteOrg}
          canEdit={settingsOrgPerms.canEditOrg}
          isOpen={Boolean(orgForSettings)}
          organization={orgForSettings}
          onClose={() => setOrgForSettings(null)}
          onRequestDelete={() => {
            const target = orgForSettings;

            setOrgForSettings(null);
            setOrgToDelete(target);
          }}
          onUpdated={() => router.refresh()}
        />
      ) : null}

      {orgToDelete && canDelete ? (
        <DeleteOrganizationModal
          isOpen={Boolean(orgToDelete)}
          organizationId={orgToDelete.id}
          organizationName={orgToDelete.name}
          onClose={() => setOrgToDelete(null)}
          onDeleted={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
