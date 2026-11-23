import type {
  EventAttachment,
  ProposalListItem,
} from "@/types/domain";

export { ACTIVITY_TYPE_LABELS } from "@/types/domain";
export type {
  ActivityType,
  AttachmentType,
  EventAttachment,
  EventProposal,
  ProposalListItem,
  ProposalStatus,
  ProposalReview,
  ReviewDecision,
  ReviewStage,
} from "@/types/domain";

export type ProposalDetail = ProposalListItem & {
  activitiesDesc: string;
  organizationGovernorId?: string | null;
  organizationAdviserId?: string | null;
  attachments: EventAttachment[];
  reviews: {
    id: string;
    stage: string;
    decision: string;
    remarks: string | null;
    reviewerName: string;
    reviewerSchoolId: string | null;
    createdAt: string;
  }[];
};

export type ProposalSemesterOption = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type ProposalFormData = {
  title: string;
  organizationId: string;
  purpose: string;
  activitiesDesc?: string;
  activityType: string;
  semesterId: string | null;
  venueId: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
};
