const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('lifeos_token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { ...this.getHeaders(), ...options.headers };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        // Clear token if unauthorized
        localStorage.removeItem('lifeos_token');
        localStorage.removeItem('lifeos_user');
        window.dispatchEvent(new Event('lifeos_auth_expired'));
      }

      if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // ignore json parse error
        }
        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth
  login(data: { email: string; password: string }) {
    return this.request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  register(data: { email: string; password: string; full_name: string }) {
    return this.request<{ access_token: string; token_type: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async demoLogin() {
    try {
      return await this.request<{ access_token: string; token_type: string; user: any }>('/auth/demo', {
        method: 'POST'
      });
    } catch (err) {
      console.warn('Backend offline or waking up. Initializing offline demo session...');
      // Fallback demo user session so the live demo never breaks on Vercel
      const demoUser = {
        id: 1,
        email: "alex@lifeos.dev",
        full_name: "Alex Mercer",
        currency: "₹",
        theme: "dark",
        monthly_budget: 25000.0,
        study_daily_target_minutes: 120,
        created_at: new Date().toISOString()
      };
      const demoToken = "demo_offline_token_" + Date.now();
      localStorage.setItem('lifeos_token', demoToken);
      localStorage.setItem('lifeos_user', JSON.stringify(demoUser));
      return {
        access_token: demoToken,
        token_type: "bearer",
        user: demoUser
      };
    }
  }

  getMe() {
    return this.request<any>('/auth/me');
  }

  updateProfile(data: any) {
    return this.request<any>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Dashboard
  getDashboard() {
    return this.request<any>('/dashboard');
  }

  // Tasks
  getTasks(params?: { status?: string; category?: string; priority?: string; goal_id?: number }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/tasks${query ? `?${query}` : ''}`);
  }

  createTask(data: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTask(id: number, data: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  toggleTask(id: number) {
    return this.request<any>(`/tasks/${id}/toggle`, {
      method: 'POST'
    });
  }

  deleteTask(id: number) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  addSubtask(taskId: number, title: string) {
    return this.request<any>(`/tasks/${taskId}/subtasks`, {
      method: 'POST',
      body: JSON.stringify({ title, is_completed: false })
    });
  }

  toggleSubtask(taskId: number, subtaskId: number) {
    return this.request<any>(`/tasks/${taskId}/subtasks/${subtaskId}/toggle`, {
      method: 'POST'
    });
  }

  // Calendar
  getEvents(start?: string, end?: string) {
    const params = new URLSearchParams();
    if (start) params.append('start', start);
    if (end) params.append('end', end);
    const query = params.toString();
    return this.request<any[]>(`/calendar/events${query ? `?${query}` : ''}`);
  }

  getIntegratedCalendar(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const query = params.toString();
    return this.request<any>(`/calendar/integrated${query ? `?${query}` : ''}`);
  }

  createEvent(data: any) {
    return this.request<any>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  deleteEvent(id: number) {
    return this.request<any>(`/calendar/events/${id}`, {
      method: 'DELETE'
    });
  }

  // Notes
  getFolders() {
    return this.request<any[]>('/notes/folders');
  }

  createFolder(name: string, icon?: string) {
    return this.request<any>('/notes/folders', {
      method: 'POST',
      body: JSON.stringify({ name, icon })
    });
  }

  getNotes(params?: { folder_id?: number; tag?: string; q?: string; is_pinned?: boolean }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/notes${query ? `?${query}` : ''}`);
  }

  createNote(data: any) {
    return this.request<any>('/notes', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateNote(id: number, data: any) {
    return this.request<any>(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  deleteNote(id: number) {
    return this.request<any>(`/notes/${id}`, {
      method: 'DELETE'
    });
  }

  // Study
  getSubjects() {
    return this.request<any[]>('/study/subjects');
  }

  createSubject(data: any) {
    return this.request<any>('/study/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  addTopic(subjectId: number, data: any) {
    return this.request<any>(`/study/subjects/${subjectId}/topics`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTopic(topicId: number, data: any) {
    return this.request<any>(`/study/topics/${topicId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  getStudySessions() {
    return this.request<any[]>('/study/sessions');
  }

  logStudySession(data: { subject_id?: number; topic_id?: number; duration_minutes: number; notes?: string; session_type?: string }) {
    return this.request<any>('/study/sessions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  generateStudyPlan(subjectId: number, examDate: string, dailyHours: number = 2) {
    return this.request<any>('/study/plan', {
      method: 'POST',
      body: JSON.stringify({
        subject_id: subjectId,
        exam_date: examDate,
        daily_available_hours: dailyHours
      })
    });
  }

  // Expenses
  getExpenses(params?: { category?: string; transaction_type?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/expenses${query ? `?${query}` : ''}`);
  }

  getExpenseSummary() {
    return this.request<any>('/expenses/summary');
  }

  createExpense(data: any) {
    return this.request<any>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  deleteExpense(id: number) {
    return this.request<any>(`/expenses/${id}`, {
      method: 'DELETE'
    });
  }

  // Documents
  getDocuments(category?: string) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<any[]>(`/documents${query}`);
  }

  createDocument(data: any) {
    return this.request<any>('/documents', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  deleteDocument(id: number) {
    return this.request<any>(`/documents/${id}`, {
      method: 'DELETE'
    });
  }

  // Goals
  getGoals(params?: { category?: string; status?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any[]>(`/goals${query ? `?${query}` : ''}`);
  }

  createGoal(data: any) {
    return this.request<any>('/goals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  deleteGoal(id: number) {
    return this.request<any>(`/goals/${id}`, {
      method: 'DELETE'
    });
  }

  addMilestone(goalId: number, data: any) {
    return this.request<any>(`/goals/${goalId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateMilestone(milestoneId: number, data: any) {
    return this.request<any>(`/goals/milestones/${milestoneId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  createTaskFromMilestone(milestoneId: number) {
    return this.request<any>(`/goals/milestones/${milestoneId}/create-task`, {
      method: 'POST'
    });
  }

  // Reminders
  getReminders(completed?: boolean) {
    const query = completed !== undefined ? `?completed=${completed}` : '';
    return this.request<any[]>(`/reminders${query}`);
  }

  createReminder(data: any) {
    return this.request<any>('/reminders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  toggleReminder(id: number) {
    return this.request<any>(`/reminders/${id}/toggle`, {
      method: 'POST'
    });
  }

  snoozeReminder(id: number, days: number = 1) {
    return this.request<any>(`/reminders/${id}/snooze?days=${days}`, {
      method: 'POST'
    });
  }

  deleteReminder(id: number) {
    return this.request<any>(`/reminders/${id}`, {
      method: 'DELETE'
    });
  }

  // Notifications
  getNotifications() {
    return this.request<any[]>('/notifications');
  }

  getUnreadNotificationsCount() {
    return this.request<{ unread_count: number }>('/notifications/unread-count');
  }

  markNotificationRead(id: number) {
    return this.request<any>(`/notifications/${id}/read`, {
      method: 'POST'
    });
  }

  markAllNotificationsRead() {
    return this.request<any>('/notifications/mark-all-read', {
      method: 'POST'
    });
  }

  // Universal Search
  search(q: string) {
    return this.request<any>(`/search?q=${encodeURIComponent(q)}`);
  }

  // AI & Natural Language
  executeCommand(query: string, executeAction: boolean = true) {
    return this.request<any>('/ai/command', {
      method: 'POST',
      body: JSON.stringify({ query, execute_action: executeAction })
    });
  }

  chatWithAI(messages: { role: string; content: string }[], includeContext: boolean = true) {
    return this.request<any>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, include_context: includeContext })
    });
  }
}

export const api = new ApiClient();
