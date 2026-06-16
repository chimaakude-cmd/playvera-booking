/** Network-wide franchisor view types (activities, bookings, etc.) */

export type OrgActivityType =
  | "camp"
  | "course"
  | "class"
  | "party"
  | "event";

export type OrgActivityStatus = "draft" | "published" | "archived";

export type OrgActivity = {
  id: string;
  title: string;
  type: OrgActivityType;
  franchiseeClubId: string;
  franchiseeClubName: string;
  venue: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  timeLabel: string;
  booked: number;
  capacity: number;
  revenuePence: number;
  status: OrgActivityStatus;
  canEdit: boolean;
};

export type OrgBookingPaymentStatus =
  | "paid"
  | "pending"
  | "refunded"
  | "partial_refund"
  | "failed";

export type OrgBookingStatus =
  | "confirmed"
  | "pending"
  | "cancelled"
  | "refund_requested";

export type OrgBooking = {
  id: string;
  reference: string;
  parentName: string;
  childName: string;
  franchiseeClubId: string;
  franchiseeClubName: string;
  activityTitle: string;
  sessionDate: string;
  paymentStatus: OrgBookingPaymentStatus;
  bookingStatus: OrgBookingStatus;
  amountPence: number;
  parentEmail: string;
};

export type OrgRegisterStatus = "open" | "closed" | "in_progress";

export type OrgRegisterSession = {
  id: string;
  sessionTitle: string;
  franchiseeClubId: string;
  franchiseeClubName: string;
  venue: string;
  activityTitle: string;
  date: string;
  timeLabel: string;
  booked: number;
  present: number;
  absent: number;
  medicalFlags: number;
  status: OrgRegisterStatus;
};

export type OrgCustomer = {
  id: string;
  parentName: string;
  children: string[];
  email: string;
  phone: string;
  franchiseeClubs: string[];
  totalBookings: number;
  totalSpendPence: number;
  lastBookingDate: string;
  isActive: boolean;
  isRepeat: boolean;
};

export type OrgMessageTemplate = {
  id: string;
  name: string;
  channel: "email" | "sms";
  trigger: string;
  lastEdited: string;
  enabled: boolean;
};

export type OrgParentReply = {
  id: string;
  parentName: string;
  franchiseeClubName: string;
  activityTitle: string;
  subject: string;
  preview: string;
  receivedAt: string;
  status: "open" | "pending" | "resolved";
  parentType: "new" | "returning";
  bookingStatus: OrgBookingStatus;
};

export type OrgCampaign = {
  id: string;
  name: string;
  franchiseeClubName: string;
  audience: string;
  sentAt: string;
  openRate: number;
  status: "draft" | "scheduled" | "sent";
};

export type OrgBroadcast = {
  id: string;
  title: string;
  scope: string;
  sentAt: string;
  recipientCount: number;
  status: "draft" | "sent";
};

export type OrgReviewStatus = "published" | "pending" | "reported" | "hidden";

export type OrgReview = {
  id: string;
  rating: number;
  body: string;
  sessionTitle: string;
  franchiseeClubId: string;
  franchiseeClubName: string;
  reviewedAt: string;
  status: OrgReviewStatus;
  parentName: string;
  flagged: boolean;
};

export type OrgStaffRole =
  | "organisation_owner"
  | "organisation_manager"
  | "finance_admin"
  | "support_admin"
  | "club_manager"
  | "coach";

export type OrgStaffStatus = "active" | "invited" | "inactive";

export type OrgStaffMember = {
  id: string;
  name: string;
  email: string;
  role: OrgStaffRole;
  assignedClubs: string[];
  status: OrgStaffStatus;
  lastActiveAt: string;
  section: "head_office" | "franchisee" | "pending";
};
