export type AttachmentTypeItem = {
  id: string;
  name: string;
  code: string;
  category: string | null;
  description: string | null;
  isRequired: boolean;
  isActive: boolean;
  templateFileName: string | null;
  templateFilePath: string | null;
  templateFileUrl: string | null;
  submissionsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AttachmentTypeFormValues = {
  name: string;
  code: string;
  category?: string | null;
  description?: string | null;
  isRequired: boolean;
  isActive: boolean;
  templateFile?: File | null;
  removeTemplate?: boolean;
};

export type AttachmentValidationResult =
  | { isValid: true; error: null }
  | { isValid: false; error: string };

export type AttachmentPermissions = {
  canView: boolean;
  canCreate: boolean;
  canChange: boolean;
  canDelete: boolean;
};
