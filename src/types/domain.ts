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
  createdAt: string;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
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
  createdAt: string;
};

export type EventProposal = {
  id: string;
  organizationId: string;
  createdBy: string;
  title: string;
  purpose: string;
  activitiesDesc: string;
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
