export type AccessibilityFeedback = {
  id: string;
  name: string;
  email: string;
  pageUrl: string;
  issue: string;
  createdAt: string;
};

export type CreateAccessibilityFeedbackInput = {
  name: string;
  email: string;
  pageUrl: string;
  issue: string;
};
