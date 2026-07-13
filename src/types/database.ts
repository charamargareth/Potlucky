export type PeriodType = "daily" | "weekly" | "monthly";
export type GroupStatus = "active" | "completed";
export type GroupVisibility = "public" | "private";
export type ExpenseCategory = "transport" | "food" | "accommodation" | "entertainment" | "shopping" | "health" | "education" | "other";
export type MemberRole = "owner" | "member";
export type ReminderFrequency = "daily" | "weekly" | "monthly" | "off";
export type NotificationType =
  | "reminder"
  | "member_contributed"
  | "target_reached"
  | "member_joined"
  | "milestone";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  username: string | null;
  daily_budget: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGroup {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  target_date: string | null;
  period_type: PeriodType;
  invite_code: string;
  created_by: string;
  status: GroupStatus;
  created_at: string;
  updated_at: string;
  visibility: GroupVisibility;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  personal_target: number | null;
  joined_at: string;
  profile?: Profile;
}

export interface Contribution {
  id: string;
  group_id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "withdrawal";
  note: string | null;
  contributed_on: string;
  created_at: string;
  profile?: Profile;
}

export interface JoinRequest {
  id: string;
  group_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
  message: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}
export interface ReminderSetting {
  id: string;
  user_id: string;
  group_id: string;
  frequency: ReminderFrequency;
  remind_hour: number;
  remind_minute: number;
  remind_weekday: number | null;
  remind_day_of_month: number | null;
  is_active: boolean;
  updated_at: string;
}

export interface PushSubscriptionRow {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  group_id: string | null;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface GroupWithStats extends SavingsGroup {
  total_saved: number;
  member_count: number;
  members_contributed_today: number;
  progress_pct: number;
}

export interface RecommendationResult {
  suggestedAmount: number;
  remainingAmount: number;
  remainingPeriods: number;
  periodLabel: string;
  isAheadOfSchedule: boolean;
  isBehindSchedule: boolean;
  withinBudget: boolean;
  message: string;
}