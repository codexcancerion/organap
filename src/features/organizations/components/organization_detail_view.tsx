"use client";

import type {
  OrganizationDetail,
  OrganizationMemberProfile,
  CandidateProfile,
  ProposalListItem,
} from "../types";

import React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  Avatar,
  Button,
  Card,
  Chip,
  EmptyState,
  Spinner,
  Tabs,
  toast,
} from "@heroui/react";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit3,
  GraduationCap,
  LayoutGrid,
  MapPin,
  Settings,
  ShieldCheck,
  User,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";

import { PageHeader } from "@/components/layout/page_header";
import { Section } from "@/components/layout/section";
import { ProposalStatusChip } from "@/components/ui/proposal_status_chip";

import { removeOrganizationMember } from "../services/organization_services";

import { AddMemberModal } from "./add_member_modal";
import { DeleteOrganizationModal } from "./delete_organization_modal";
import { EditOrganizationModal } from "./edit_organization_modal";
import { EditPositionModal } from "./edit_position_modal";
import { ManageLeadersModal } from "./manage_leaders_modal";

export function OrganizationDetailView({
  organization,
  currentUserId,
  candidates = [],
}: {
  organization: OrganizationDetail;
  currentUserId: string | null;
  candidates?: CandidateProfile[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"cards" | "calendar">("cards");

  // Modals state
  const [selectedMember, setSelectedMember] = React.useState<OrganizationMemberProfile | null>(null);
  const [isEditPositionModalOpen, setIsEditPositionModalOpen] = React.useState(false);
  const [memberPendingRemoval, setMemberPendingRemoval] =
    React.useState<OrganizationMemberProfile | null>(null);
  const [isRemovingMember, setIsRemovingMember] = React.useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = React.useState(false);
  const [isManageLeadersModalOpen, setIsManageLeadersModalOpen] = React.useState(false);
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = React.useState(false);
  const [isDeleteOrgModalOpen, setIsDeleteOrgModalOpen] = React.useState(false);

  // Calendar state for Events tab
  const [calendarDate, setCalendarDate] = React.useState(new Date());
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleString("default", { month: "long" });
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const today = () => setCalendarDate(new Date());

  const calendarDays = React.useMemo(() => {
    const yr = calendarDate.getFullYear();
    const mth = calendarDate.getMonth();
    const count = new Date(yr, mth + 1, 0).getDate();
    const days: { dayNumber: number; dateString: string; events: ProposalListItem[] }[] = [];

    for (let i = 1; i <= count; i++) {
      const dateStr = `${yr}-${String(mth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayEvents = organization.events.filter((e) => {
        const eDate = new Date(e.startTime);

        return (
          eDate.getFullYear() === yr &&
          eDate.getMonth() === mth &&
          eDate.getDate() === i
        );
      });

      days.push({ dayNumber: i, dateString: dateStr, events: dayEvents });
    }

    return days;
  }, [organization.events, calendarDate]);

  // Leaders User IDs to exclude from the general Members list
  const leaderUserIds = React.useMemo(() => {
    const ids = new Set<string>();

    if (organization.governor?.id) ids.add(organization.governor.id);
    if (organization.adviser?.id) ids.add(organization.adviser.id);

    return ids;
  }, [organization.governor, organization.adviser]);

  // Filter out leaders so they don't appear redundantly in the Members grid
  const nonLeaderMembers = React.useMemo(() => {
    return organization.members.filter((m) => !leaderUserIds.has(m.userId));
  }, [organization.members, leaderUserIds]);

  // Existing user IDs in organization (to prevent duplicate adds)
  const existingOrgUserIds = React.useMemo(() => {
    return organization.members.map((m) => m.userId);
  }, [organization.members]);

  const handleEditPosition = (member: OrganizationMemberProfile) => {
    setSelectedMember(member);
    setIsEditPositionModalOpen(true);
  };

  const handleConfirmRemoveMember = async () => {
    if (!memberPendingRemoval) return;

    setIsRemovingMember(true);
    try {
      const res = await removeOrganizationMember(memberPendingRemoval.id);

      if (!res.success) {
        toast.danger("Failed to remove member", {
          description: res.error.message,
        });

        return;
      }

      toast.success("Member removed", {
        description: `Successfully removed ${memberPendingRemoval.fullName} from ${organization.acronym}.`,
      });
      setMemberPendingRemoval(null);
      router.refresh();
    } catch (err: unknown) {
      toast.danger("Error removing member", {
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
      });
    } finally {
      setIsRemovingMember(false);
    }
  };

  const perms = organization.permissions;

  // UI/UX FLOW: Expose only a single HeroUI Settings button in the header and omit
  // header meta lines below the description; destructive deletion lives in the Settings Danger Zone.
  const headerActions =
    perms.canEditThisOrg || perms.canDeleteOrganizations ? (
      <Button
        size="sm"
        variant="secondary"
        onPress={() => setIsEditOrgModalOpen(true)}
      >
        <Settings size={14} />
        Settings
      </Button>
    ) : undefined;

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in">
      {/* ── Unified Cardless Page Header with Breadcrumbs, 1 Chip, & Rightmost Actions ── */}
      <PageHeader
        actions={headerActions}
        badge={
          <Chip
            color={organization.isActive ? "success" : "default"}
            size="sm"
            variant="soft"
          >
            {organization.isActive ? "Recognized & Active" : "Inactive"}
          </Chip>
        }
        breadcrumbs={[
          { label: "Back to Organizations", href: "/organizations" },
          { label: organization.acronym },
        ]}
        description={organization.description ?? undefined}
        media={
          <Avatar className="w-16 h-16 sm:w-20 sm:h-20 text-xl font-bold rounded-3xl bg-accent/10 text-accent border border-accent/20 shrink-0 shadow-xs">
            {organization.logoUrl ? (
              <Avatar.Image
                alt={organization.name}
                className="object-cover"
                src={organization.logoUrl}
              />
            ) : null}
            <Avatar.Fallback className="bg-accent/10 text-accent text-xl sm:text-2xl font-black">
              {organization.acronym.slice(0, 4)}
            </Avatar.Fallback>
          </Avatar>
        }
        title={organization.name}
      />

      {/* ── Compact Leadership Profiles Section ── */}
      <Section
        actions={
          perms.canChangeLeaders ? (
            <Button
              size="sm"
              variant="secondary"
              onPress={() => setIsManageLeadersModalOpen(true)}
            >
              <Edit3 size={13} />
              Manage Leaders
            </Button>
          ) : undefined
        }
        description="Official university endorsement officers for event proposals and compliance."
        icon={<ShieldCheck className="text-accent" size={18} />}
        title="Organization Leadership"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Governor Card */}
          <Card className="p-4 bg-surface border border-accent/25 rounded-2xl flex flex-col justify-start items-start gap-3 relative overflow-hidden">
            <div className="flex items-start gap-3 w-full min-w-0">
              <Avatar className="w-11 h-11 text-xs font-bold rounded-xl bg-accent/15 text-accent border border-accent/30 shrink-0 mt-0.5">
                {organization.governor?.avatarUrl ? (
                  <Avatar.Image
                    alt={organization.governor.fullName ?? "Governor"}
                    className="object-cover"
                    src={organization.governor.avatarUrl}
                  />
                ) : null}
                <Avatar.Fallback>
                  <User size={18} />
                </Avatar.Fallback>
              </Avatar>
              <div className="flex flex-col items-start text-left min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Governor / President
                </span>
                <h3 className="text-sm font-bold text-foreground truncate mt-0.5 w-full text-left">
                  {organization.governor?.fullName ?? "Unassigned Governor"}
                </h3>
                <span className="text-[11px] text-muted truncate w-full text-left">
                  {organization.governor?.schoolId
                    ? `ID: ${organization.governor.schoolId}`
                    : organization.governor?.email ?? "Campus Student Leader"}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-muted text-left flex items-center gap-1.5 pt-0.5">
              <span className="font-medium text-foreground">Proposals &amp; Roster:</span>
              <span>Primary Student Signatory</span>
            </div>
          </Card>

          {/* Faculty Adviser Card */}
          <Card className="p-4 bg-surface border border-primary/25 rounded-2xl flex flex-col justify-start items-start gap-3 relative overflow-hidden">
            <div className="flex items-start gap-3 w-full min-w-0">
              <Avatar className="w-11 h-11 text-xs font-bold rounded-xl bg-primary/15 text-primary border border-primary/30 shrink-0 mt-0.5">
                {organization.adviser?.avatarUrl ? (
                  <Avatar.Image
                    alt={organization.adviser.fullName ?? "Adviser"}
                    className="object-cover"
                    src={organization.adviser.avatarUrl}
                  />
                ) : null}
                <Avatar.Fallback>
                  <GraduationCap size={18} />
                </Avatar.Fallback>
              </Avatar>
              <div className="flex flex-col items-start text-left min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Faculty Adviser
                </span>
                <h3 className="text-sm font-bold text-foreground truncate mt-0.5 w-full text-left">
                  {organization.adviser?.fullName ?? "Unassigned Faculty Adviser"}
                </h3>
                <span className="text-[11px] text-muted truncate w-full text-left">
                  {organization.adviser?.schoolId
                    ? `Faculty ID: ${organization.adviser.schoolId}`
                    : organization.adviser?.email ?? "Academic Faculty"}
                </span>
              </div>
            </div>
            <div className="text-[11px] text-muted text-left flex items-center gap-1.5 pt-0.5">
              <span className="font-medium text-foreground">Stage 1 Endorsement:</span>
              <span>Academic &amp; Activity Oversight</span>
            </div>
          </Card>
        </div>
      </Section>

      {/* ── Members & Roster Section (Non-leaders only) ── */}
      <Section
        actions={
          perms.canManageMembers ? (
            <Button
              size="sm"
              variant="primary"
              onPress={() => setIsAddMemberModalOpen(true)}
            >
              <UserPlus size={14} />
              Add Member
            </Button>
          ) : undefined
        }
        badge={
          <Chip size="sm" variant="soft">
            {nonLeaderMembers.length} {nonLeaderMembers.length === 1 ? "Member" : "Members"}
          </Chip>
        }
        icon={<Users className="text-foreground" size={18} />}
        title="Organization Members"
      >
        {nonLeaderMembers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 items-stretch">
            {nonLeaderMembers.map((member) => (
              <Card
                key={member.id}
                className="p-4 bg-surface border border-border/30 rounded-2xl flex flex-col justify-between gap-3 hover:border-border/60 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-10 h-10 text-xs font-bold rounded-xl bg-default/15 text-foreground shrink-0">
                    {member.avatarUrl ? (
                      <Avatar.Image
                        alt={member.fullName}
                        className="object-cover"
                        src={member.avatarUrl}
                      />
                    ) : null}
                    <Avatar.Fallback>
                      {member.fullName.slice(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-bold text-foreground truncate">
                      {member.fullName}
                    </span>
                    <span className="text-xs text-muted truncate">
                      {member.schoolId ? `ID: ${member.schoolId}` : member.email}
                      {member.isOfficer ? " · Officer" : ""}
                    </span>
                    <div className="mt-1.5">
                      <Chip className="font-semibold text-[11px]" size="sm" variant="soft">
                        {member.position}
                      </Chip>
                    </div>
                  </div>
                </div>

                {perms.canEditPositions ? (
                  <div className="pt-2 border-t border-border/20 flex items-center justify-between">
                    <Button
                      className="text-xs text-danger hover:text-danger"
                      size="sm"
                      variant="ghost"
                      onPress={() => setMemberPendingRemoval(member)}
                    >
                      <UserX size={13} />
                      Remove
                    </Button>
                    <Button
                      className="text-xs"
                      size="sm"
                      variant="ghost"
                      onPress={() => handleEditPosition(member)}
                    >
                      <Edit3 size={13} />
                      Edit Position
                    </Button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border border-dashed border-border/60 bg-surface/50 p-8 rounded-2xl">
            <EmptyState className="flex flex-col items-center text-center gap-2">
              <Users className="text-muted size-7" />
              <p className="text-sm font-semibold text-foreground">No General Members Yet</p>
              <p className="text-xs text-muted max-w-sm">
                Leadership is established above. Click &quot;Add Member&quot; to enroll officers, committee leads, and student members.
              </p>
            </EmptyState>
          </Card>
        )}
      </Section>

      {/* ── Organization Events Section with HeroUI Tabs ── */}
      <Section
        bordered
        actions={
          <Tabs
            selectedKey={activeTab}
            onSelectionChange={(key) => setActiveTab(String(key) as "cards" | "calendar")}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Organization events view">
                <Tabs.Tab className="text-xs" id="cards">
                  <span className="inline-flex items-center gap-1.5">
                    <LayoutGrid size={14} />
                    Cards
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab className="text-xs" id="calendar">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} />
                    Calendar
                  </span>
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        }
        badge={
          <Chip size="sm" variant="soft">
            {organization.events.length} {organization.events.length === 1 ? "Event" : "Events"}
          </Chip>
        }
        description={`Activity proposals and approved campus schedules for ${organization.acronym}`}
        icon={<Calendar className="text-primary" size={18} />}
        title="Organization Events"
      >
        {/* Tab 1: Cards View */}
        {activeTab === "cards" && (
          <div className="flex flex-col gap-4">
            {organization.events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {organization.events.map((event) => (
                  <Card
                    key={event.id}
                    className="p-5 bg-surface border border-border/30 rounded-2xl flex flex-col justify-between gap-4 hover:border-accent/40 transition-colors"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <ProposalStatusChip status={event.status} />
                        <span className="text-[11px] text-muted">
                          By {event.creatorName}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {event.purpose}
                      </p>

                      <div className="grid grid-cols-1 gap-1 text-xs text-muted pt-2 border-t border-border/20">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} />
                          <span className="truncate">{event.venueName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} />
                          <span>
                            {new Date(event.startTime).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/20 flex justify-end">
                      <NextLink
                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                        href={`/events/${event.id}`}
                      >
                        View Event <ArrowRight size={13} />
                      </NextLink>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-dashed border-border/60 bg-surface/50 p-8 rounded-2xl">
                <EmptyState className="flex flex-col items-center text-center gap-2">
                  <Calendar className="text-muted size-7" />
                  <p className="text-sm font-semibold text-foreground">No Events Recorded</p>
                  <p className="text-xs text-muted">
                    No activity proposals or approved events have been logged for this group.
                  </p>
                </EmptyState>
              </Card>
            )}
          </div>
        )}

        {/* Tab 2: Calendar View */}
        {activeTab === "calendar" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">
                  {monthName} {year}
                </h3>
                <Button size="sm" variant="ghost" onPress={today}>
                  Today
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button aria-label="Previous month" size="sm" variant="ghost" onPress={prevMonth}>
                  <ChevronLeft size={16} />
                </Button>
                <Button aria-label="Next month" size="sm" variant="ghost" onPress={nextMonth}>
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>

            <div className="border border-border/30 rounded-2xl overflow-hidden bg-surface">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-border/30 bg-default/5 text-center text-xs font-semibold text-muted py-2">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 auto-rows-fr">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="min-h-24 p-1.5 border-b border-r border-border/20 bg-default/5"
                  />
                ))}

                {calendarDays.map((day) => {
                  const isCurrentDay =
                    day.dayNumber === new Date().getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();

                  return (
                    <div
                      key={day.dateString}
                      className={`min-h-24 p-1.5 border-b border-r border-border/20 flex flex-col justify-between transition-colors ${
                        isCurrentDay ? "bg-accent/5 font-bold" : "hover:bg-default/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs w-6 h-6 flex items-center justify-center rounded-full ${
                            isCurrentDay
                              ? "bg-accent text-accent-foreground"
                              : "text-muted"
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                        {day.events.length > 0 && (
                          <span className="text-[10px] text-accent font-semibold">
                            {day.events.length} event{day.events.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-1 mt-1 overflow-hidden">
                        {day.events.map((e) => (
                          <NextLink
                            key={e.id}
                            className="p-1 rounded bg-accent/15 text-accent text-[10px] font-semibold truncate hover:bg-accent/25 transition-colors block"
                            href={`/events/${e.id}`}
                            title={e.title}
                          >
                            {e.title}
                          </NextLink>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ── Modals & AlertDialogs ── */}
      <AlertDialog
        isOpen={Boolean(memberPendingRemoval)}
        onOpenChange={(open) => !open && !isRemovingMember && setMemberPendingRemoval(null)}
      >
        <AlertDialog.Backdrop variant="blur">
          <AlertDialog.Container size="sm">
            <AlertDialog.Dialog className="border border-danger/30 shadow-xl bg-surface">
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon status="danger" />
                <AlertDialog.Heading>Remove Organization Member</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>
                <p className="text-sm text-foreground/85 leading-relaxed">
                  Are you sure you want to remove{" "}
                  <strong>{memberPendingRemoval?.fullName}</strong> from{" "}
                  <strong>{organization.acronym}</strong>?
                </p>
              </AlertDialog.Body>
              <AlertDialog.Footer className="flex items-center justify-end gap-2">
                <Button
                  isDisabled={isRemovingMember}
                  size="sm"
                  type="button"
                  variant="tertiary"
                  onPress={() => setMemberPendingRemoval(null)}
                >
                  Cancel
                </Button>
                <Button
                  isDisabled={isRemovingMember}
                  isPending={isRemovingMember}
                  size="sm"
                  type="button"
                  variant="danger"
                  onPress={handleConfirmRemoveMember}
                >
                  {isRemovingMember ? <Spinner color="current" size="sm" /> : null}
                  {isRemovingMember ? "Removing…" : "Remove Member"}
                </Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>

      <EditPositionModal
        isOpen={isEditPositionModalOpen}
        member={selectedMember}
        orgName={organization.name}
        onClose={() => {
          setIsEditPositionModalOpen(false);
          setSelectedMember(null);
        }}
      />

      {perms.canManageMembers ? (
        <AddMemberModal
          candidates={candidates}
          existingUserIds={existingOrgUserIds}
          isOpen={isAddMemberModalOpen}
          organizationId={organization.id}
          onClose={() => setIsAddMemberModalOpen(false)}
          onMemberAdded={() => router.refresh()}
        />
      ) : null}

      {perms.canChangeLeaders ? (
        <ManageLeadersModal
          canUpdateAll={perms.canUpdateAllOrganizations}
          candidates={candidates}
          currentAdviserId={organization.adviser?.id ?? null}
          currentGovernorId={organization.governor?.id ?? null}
          currentUserId={currentUserId}
          isOpen={isManageLeadersModalOpen}
          organizationId={organization.id}
          onClose={() => setIsManageLeadersModalOpen(false)}
          onUpdated={() => router.refresh()}
        />
      ) : null}

      {perms.canEditThisOrg || perms.canDeleteOrganizations ? (
        <EditOrganizationModal
          canDelete={perms.canDeleteOrganizations}
          canEdit={perms.canEditThisOrg}
          isOpen={isEditOrgModalOpen}
          organization={organization}
          onClose={() => setIsEditOrgModalOpen(false)}
          onRequestDelete={() => {
            setIsEditOrgModalOpen(false);
            setIsDeleteOrgModalOpen(true);
          }}
          onUpdated={() => router.refresh()}
        />
      ) : null}

      {perms.canDeleteOrganizations ? (
        <DeleteOrganizationModal
          isOpen={isDeleteOrgModalOpen}
          organizationId={organization.id}
          organizationName={organization.name}
          onClose={() => setIsDeleteOrgModalOpen(false)}
        />
      ) : null}
    </div>
  );
}
