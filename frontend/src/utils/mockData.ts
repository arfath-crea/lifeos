// Fallback mock dataset for live preview when cloud backend is not connected yet
import { DashboardSummary, Task, Subject, ExpenseSummary, DocumentVault, Goal, Reminder, CalendarEvent, Note, NoteFolder } from '../types';

const now = new Date();

export const fallbackDashboard: DashboardSummary = {
  greeting: "Good evening, Alex 👋",
  date_str: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  metrics: [
    { label: "Tasks Remaining", value: "4", subtext: "1 completed today", color: "amber" },
    { label: "Upcoming Events", value: "3", subtext: "Next 7 days", color: "blue" },
    { label: "Monthly Spend", value: "₹4,970", subtext: "Budget: ₹25,000", color: "indigo" },
    { label: "Active Goals", value: "1", subtext: "2 subjects tracked", color: "purple" }
  ],
  ai_briefing: "Here's what needs your attention today. You have 4 pending tasks (2 urgent) and 3 events scheduled over the next 7 days. Remember, Java & Object-Oriented Design exam is coming up on Friday.",
  ai_insights: [
    "You have 2 high-priority tasks. Focus on 'Submit Distributed Systems Assignment' first.",
    "Upcoming Java exam in 4 days. Ensure remaining topics are revised.",
    "Document alert: AWS Certified Developer Certificate is due for renewal soon."
  ],
  priority_tasks: [
    {
      id: 1,
      user_id: 1,
      title: "Submit Distributed Systems Assignment",
      description: "Complete Raft simulation and submit 4-page report",
      status: "IN_PROGRESS",
      priority: "URGENT",
      category: "Academics",
      due_date: new Date(Date.now() + 86400000).toISOString(),
      is_recurring: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: [
        { id: 1, task_id: 1, title: "Research Raft algorithm", is_completed: true, created_at: now.toISOString() },
        { id: 2, task_id: 1, title: "Write Python simulation script", is_completed: true, created_at: now.toISOString() },
        { id: 3, task_id: 1, title: "Format final PDF report", is_completed: false, created_at: now.toISOString() }
      ]
    },
    {
      id: 2,
      user_id: 1,
      title: "Pay Electricity & Wi-Fi Bill",
      status: "TODO",
      priority: "HIGH",
      category: "Finance",
      due_date: new Date(Date.now() + 172800000).toISOString(),
      is_recurring: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      subtasks: []
    }
  ],
  upcoming_events: [
    {
      id: 1,
      user_id: 1,
      title: "Java & Data Structures End-Sem Exam",
      event_type: "Exam",
      start_time: new Date(Date.now() + 345600000).toISOString(),
      is_all_day: false,
      color: "#ef4444",
      created_at: now.toISOString()
    },
    {
      id: 2,
      user_id: 1,
      title: "Doctor Dental Checkup",
      event_type: "Appointment",
      start_time: new Date(Date.now() + 172800000).toISOString(),
      is_all_day: false,
      color: "#3b82f6",
      created_at: now.toISOString()
    }
  ],
  pending_reminders: [
    {
      id: 1,
      user_id: 1,
      title: "Renew AWS Certification (expires in 26 days)",
      due_date: new Date(Date.now() + 2246400000).toISOString(),
      priority: "HIGH",
      source_module: "DOCUMENT",
      is_completed: false,
      created_at: now.toISOString()
    }
  ],
  active_goals: [
    {
      id: 1,
      user_id: 1,
      title: "Become a Full-Stack Software Engineer",
      category: "Career",
      status: "ACTIVE",
      progress_percentage: 65,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      milestones: []
    }
  ],
  recent_spending_total: 4970,
  monthly_budget: 25000,
  study_progress_summary: {
    total_subjects: 2,
    upcoming_exams_count: 1,
    daily_target_minutes: 120
  }
};
