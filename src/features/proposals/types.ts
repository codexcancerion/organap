export type {
  EventProposal,
  ProposalStatus,
  ProposalReview,
  ReviewDecision,
  ReviewStage,
} from "@/types/domain";

export type ProposalListItem = {
  id: string;
  title: string;
  purpose: string;
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

export type ProposalDetail = ProposalListItem & {
  activitiesDesc: string;
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

export type ProposalFormData = {
  title: string;
  organizationId: string;
  purpose: string;
  activitiesDesc: string;
  venueId: string;
  startTime: string;
  endTime: string;
  registrationDeadline: string;
  capacity: number;
};
