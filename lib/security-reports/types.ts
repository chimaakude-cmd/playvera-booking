export type SecurityReport = {
  id: string;
  name: string;
  email: string;
  issue: string;
  attachmentName: string | null;
  createdAt: string;
};

export type CreateSecurityReportInput = {
  name: string;
  email: string;
  issue: string;
  attachmentName?: string | null;
};
