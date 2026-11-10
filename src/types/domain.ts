// Domain model types for OrGanap

export type AppRole = "superadmin" | "student_affairs" | "adviser" | "officer" | "student";
export type UserRole = AppRole;

export type AuthUser = {
  id: string;
  email: string;
  role: AppRole;
  displayName: string | null;
  schoolId: string | null;
  avatarUrl: string | null;
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
  status: "confirmed" | "withdrawn";
  registeredAt: string;
  withdrawnAt: string | null;
};

export type AttendanceRecord = {
  id: string;
  proposalId: string;
  registrationId: string;
  studentId: string;
  verifiedBy: string;
  method: "manual" | "qr";
  checkedInAt: string;
};

export type UserProfile = {
  id: string;
  role: UserRole;
  schoolId: string | null;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
