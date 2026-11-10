"use client";

import type { ProposalListItem } from "../types";

import React from "react";
import NextLink from "next/link";
import {
  Button,
  Card,
  Input,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Users,
  Building2,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";

import { ProposalStatusChip } from "./proposal_status_chip";

export type ProposalListProps = {
  proposals: ProposalListItem[];
  canCreate?: boolean;
};

export function ProposalList({ proposals, canCreate = true }: ProposalListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const filtered = React.useMemo(() => {
    return proposals.filter((p) => {
      const matchSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.organizationName.toLowerCase().includes(search.toLowerCase()) ||
        p.venueName.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || p.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [proposals, search, statusFilter]);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in">
      {/* Standard Cardless Page Header */}
      <PageHeader
        actions={
          canCreate ? (
            <NextLink href="/proposals/new">
              <Button size="md" variant="primary">
                <Plus size={16} />
                Draft Proposal
              </Button>
            </NextLink>
          ) : undefined
        }
        badge={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
            {proposals.length} Proposals
          </span>
        }
        description="Submit, track, and manage student organization activity proposals through two-stage endorsement and venue verification."
        title="Event Proposals"
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <TextField
            aria-label="Search proposals"
            value={search}
            onChange={(val) => setSearch(val)}
          >
            <div className="relative w-full">
              <Input
                className="pl-9"
                placeholder="Search by event title, org, or venue…"
              />
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                size={15}
              />
            </div>
          </TextField>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Filter size={14} />
            <span>Status:</span>
          </div>
          <Select
            aria-label="Filter by proposal status"
            className="w-48"
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                <ListBox.Item id="all" textValue="All Proposals">
                  All Proposals
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="draft" textValue="Drafts Only">
                  Drafts Only
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="pending_adviser" textValue="Pending Adviser">
                  Pending Adviser
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="pending_student_affairs" textValue="Pending Student Affairs">
                  Pending Student Affairs
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="returned_by_adviser" textValue="Needs Revision">
                  Needs Revision
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="approved" textValue="Approved Events">
                  Approved Events
                  <ListBox.ItemIndicator />
                </ListBox.Item>
                <ListBox.Item id="rejected_by_student_affairs" textValue="Rejected">
                  Rejected
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        {filtered.map((item) => (
          <NextLink key={item.id} className="block group" href={`/proposals/${item.id}`}>
            <Card className="border border-border/30 hover:border-accent/40 transition-colors bg-surface p-5 gap-3 cursor-pointer">
              <Card.Header className="flex flex-col gap-1 p-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-accent flex items-center gap-1">
                    <Building2 size={13} />
                    {item.organizationName}
                  </span>
                  <ProposalStatusChip status={item.status} />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-accent transition-colors line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-muted line-clamp-2">
                  {item.purpose}
                </p>
              </Card.Header>

              <Card.Content className="p-0 flex-initial">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted pt-1 border-t border-border/20">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="text-primary shrink-0" size={13} />
                    <span className="truncate">{item.venueName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="text-primary shrink-0" size={13} />
                    <span>{item.capacity} capacity</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate col-span-2">
                    <Calendar className="text-primary shrink-0" size={13} />
                    <span>{new Date(item.startTime).toLocaleDateString()} · {new Date(item.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </Card.Content>

              <Card.Footer className="p-0 pt-2 flex items-center justify-between text-xs text-muted border-t border-border/20">
                <span>By {item.creatorName ?? "Officer"}</span>
                <span className="flex items-center gap-1 text-accent font-semibold group-hover:translate-x-0.5 transition-transform">
                  View Proposal <ArrowRight size={13} />
                </span>
              </Card.Footer>
            </Card>
          </NextLink>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="border border-dashed border-border/60 bg-surface p-12 text-center flex flex-col items-center gap-3">
          <Clock className="text-muted size-10" />
          <h3 className="text-base font-semibold text-foreground">No Event Proposals Found</h3>
          <p className="text-xs text-muted max-w-md">
            No proposal documents match your search query or filter. Create a new event draft to begin the endorsement workflow.
          </p>
          {canCreate && (
            <NextLink href="/proposals/new">
              <Button className="mt-2" size="sm" variant="primary">
                <Plus size={15} />
                Draft Proposal
              </Button>
            </NextLink>
          )}
        </Card>
      )}
    </div>
  );
}
