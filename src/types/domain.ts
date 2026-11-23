// Domain model types for OrGanap — Django-style dynamic RBAC & event workflows

export type Permission = {
  id: string;
  code: string;
  name: string;
  module: string;
  description: string | null;
};

export type UserGroup = {
  id: string;
  name: string;
  description: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  displayName: string | null;
  schoolId: string | null;
  avatarUrl: string | null;
  isSuperuser: boolean;
  isStaff: boolean;
  isActive: boolean;
  groups: string[];
  permissions: string[];
};

export type ProposalStatus =
  | "draft"
  | "pending_adviser"
  | "returned_by_adviser"
  | "rejected_by_adviser"
  | "pending_student_affairs"
  | "returned_by_student_affairs"
  | "rejected_by_student_affairs"
  | "approved"
  | "cancelled";

export type ReviewDecision = "endorsed" | "returned" | "rejected" | "approved" | "cancelled";

export type ReviewStage = "adviser" | "student_affairs";

export type OrganizationCategory =
  | "academic"
  | "student_government"
  | "cultural"
  | "service"
  | "sports"
  | "special_interest";

export type Organization = {
  id: string;
  name: string;
  acronym: string;
  slug: string;
  description: string | null;
  category: string;
  logoUrl: string | null;
  isActive: boolean;
  governorId: string | null;
  adviserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  position: string | null;
  positionTitle: string | null;
  isOfficer: boolean;
  isAdviser: boolean;
  createdAt: string;
};

export type Venue = {
  id: string;
  name: string;
  location: string | null;
  capacity: number;
  isActive: boolean;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityType =
  | "seminar"
  | "workshop"
  | "competition"
  | "assembly"
  | "outreach"
  | "cultural"
  | "sports"
  | "other";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  seminar: "Seminar / Conference",
  workshop: "Workshop / Training",
  competition: "Competition / Hackathon",
  assembly: "General Assembly / Forum",
  outreach: "Community Outreach",
  cultural: "Cultural / Arts Showcase",
  sports: "Sports / Tournament",
  other: "Other Campus Activity",
};

export type AttachmentType = {
  id: string;
  name: string;
  code: string;
  category?: string | null;
  description: string | null;
  isRequired: boolean;
  isActive: boolean;
  templateFileName?: string | null;
  templateFilePath?: string | null;
  templateFileUrl?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EventAttachment = {
  id: string;
  proposalId: string;
  attachmentTypeId: string | null;
  attachmentTypeName: string | null;
  attachmentTypeCode: string | null;
  attachmentTypeCategory?: string | null;
  fileName: string;
  filePath: string;
  fileUrl: string;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: string | null;
  uploadedByName?: string | null;
  createdAt: string;
};

export type EventProposal = {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  purpose: string;
  activitiesDesc: string;
  activityType: string;
  semesterId: string | null;
  venueId: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  status: ProposalStatus;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProposalListItem = {
  id: string;
  title: string;
  purpose: string;
  activityType?: string;
  semesterId?: string | null;
  semesterName?: string | null;
  organizationId: string;
  organizationName: string;
  organizationAcronym: string;
  venueId: string;
  venueName: string;
  venueCapacity: number;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
  status: string;
  cancellationReason: string | null;
  createdById: string | null;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProposalReview = {
  id: string;
  proposalId: string;
  reviewerId: string;
  decision: ReviewDecision;
  remarks: string | null;
  stage: ReviewStage;
  createdAt: string;
};

export type EventRegistration = {
  id: string;
  proposalId: string;
  studentId: string;
  qrToken: string;
  status: "confirmed" | "withdrawn" | "attended";
  createdAt: string;
  updatedAt: string;
};

export type AttendanceRecord = {
  id: string;
  proposalId: string;
  registrationId: string;
  studentId: string;
  verifiedBy: string;
  checkInMethod: "manual" | "qr_scanner";
  checkInAt: string;
};

export type InAppNotification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

export type ServiceResult<T = void> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { message: string } };

export type UserProfile = {
  id: string;
  schoolId: string | null;
  displayName: string;
  avatarUrl: string | null;
  isSuperuser: boolean;
  isStaff: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DepartmentSummary = {
  id: string;
  name: string;
  code: string;
};

export type Department = DepartmentSummary & {
  createdAt: string;
  updatedAt: string;
};

export type Program = {
  id: string;
  departmentId: string;
  name: string;
  code: string;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = {
  proposalAlerts: boolean;
  eventReminders: boolean;
  emailNotifications: boolean;
  compactSidebarDefault: boolean;
};
