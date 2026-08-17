export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';

export interface User {
  id: number;
  email: string;
  full_name: string;
  avatar_url?: string;
  currency: string;
  theme: string;
  monthly_budget: number;
  study_daily_target_minutes: number;
  created_at: string;
}

export interface Subtask {
  id: number;
  task_id: number;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  due_date?: string;
  category: string;
  tags?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  goal_id?: number;
  milestone_id?: number;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  subtasks: Subtask[];
}

export interface CalendarEvent {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  event_type: 'Exam' | 'Meeting' | 'Appointment' | 'Birthday' | 'Deadline' | 'Event';
  start_time: string;
  end_time?: string;
  location?: string;
  is_all_day: boolean;
  color?: string;
  created_at: string;
}

export interface NoteFolder {
  id: number;
  user_id: number;
  name: string;
  icon?: string;
  parent_folder_id?: number;
  created_at: string;
  note_count?: number;
}

export interface Note {
  id: number;
  user_id: number;
  folder_id?: number;
  title: string;
  content: string;
  tags?: string;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface Topic {
  id: number;
  subject_id: number;
  name: string;
  mastery_percentage: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  notes?: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: number;
  user_id: number;
  name: string;
  code?: string;
  color?: string;
  exam_date?: string;
  target_hours: number;
  created_at: string;
  topics: Topic[];
  overall_mastery?: number;
}

export interface StudySession {
  id: number;
  user_id: number;
  subject_id?: number;
  topic_id?: number;
  duration_minutes: number;
  notes?: string;
  session_type: string;
  created_at: string;
  subject_name?: string;
  topic_name?: string;
}

export interface Expense {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  transaction_type: 'EXPENSE' | 'INCOME';
  category: string;
  payment_method: string;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  notes?: string;
  created_at: string;
}

export interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface ExpenseSummary {
  total_income: number;
  total_expense: number;
  net_savings: number;
  monthly_budget: number;
  budget_used_percentage: number;
  categories: CategorySpending[];
  recent_transactions: Expense[];
}

export interface DocumentVault {
  id: number;
  user_id: number;
  title: string;
  category: string;
  document_number?: string;
  issue_date?: string;
  expiry_date?: string;
  reminder_days_before: number;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  notes?: string;
  is_verified: boolean;
  days_to_expiry?: number;
  expiry_status: 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'NO_EXPIRY';
  created_at: string;
}

export interface Milestone {
  id: number;
  goal_id: number;
  title: string;
  target_date?: string;
  is_completed: boolean;
  progress_percentage: number;
  order_index: number;
  created_at: string;
}

export interface Goal {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  category: string;
  target_date?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  progress_percentage: number;
  created_at: string;
  updated_at: string;
  milestones: Milestone[];
}

export interface Reminder {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  due_date: string;
  priority: Priority;
  source_module: string;
  source_id?: number;
  is_completed: boolean;
  snoozed_until?: string;
  created_at: string;
  is_overdue?: boolean;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'INFO' | 'WARNING' | 'ALERT' | 'SUCCESS';
  source_module: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface MetricCard {
  label: string;
  value: string;
  subtext: string;
  trend?: string;
  color?: string;
}

export interface DashboardSummary {
  greeting: string;
  date_str: string;
  metrics: MetricCard[];
  ai_briefing: string;
  ai_insights: string[];
  priority_tasks: Task[];
  upcoming_events: CalendarEvent[];
  pending_reminders: Reminder[];
  active_goals: Goal[];
  recent_spending_total: number;
  monthly_budget: number;
  study_progress_summary: {
    total_subjects: number;
    upcoming_exams_count: number;
    daily_target_minutes: number;
  };
}

export interface NaturalLanguageResult {
  understood_intent: string;
  response_message: string;
  action_performed?: {
    action_type: string;
    entity_name: string;
    parameters: any;
    confidence: number;
    description: string;
  };
  created_entity_id?: number;
  created_entity_type?: string;
  created_entity_data?: any;
}
