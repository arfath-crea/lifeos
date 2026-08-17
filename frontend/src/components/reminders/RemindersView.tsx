import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { Reminder, Priority } from '../../types';
import {
  BellRing,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertCircle,
  Trash2,
  RotateCw,
  Loader2,
  X
} from 'lucide-react';

export const RemindersView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast, fireConfetti } = useLifeOS();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  // New Reminder Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDueTime, setNewDueTime] = useState('09:00');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReminders();
  }, [refreshKey]);

  const fetchReminders = async () => {
    try {
      const res = await api.getReminders();
      setReminders(res);
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (rem: Reminder) => {
    try {
      const res = await api.toggleReminder(rem.id);
      if (res.is_completed) {
        fireConfetti();
        addToast(`Completed reminder: "${rem.title}"`, 'success');
      }
      triggerRefresh();
    } catch {
      addToast('Failed to update reminder', 'error');
    }
  };

  const handleSnooze = async (id: number, days: number = 1) => {
    try {
      await api.snoozeReminder(id, days);
      addToast(`Snoozed for ${days} day(s)`, 'info');
      triggerRefresh();
    } catch {
      addToast('Failed to snooze reminder', 'error');
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      await api.deleteReminder(id);
      addToast('Reminder removed', 'info');
      triggerRefresh();
    } catch {
      addToast('Failed to delete reminder', 'error');
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const dueDateTime = new Date(`${newDueDate}T${newDueTime}:00`);
      await api.createReminder({
        title: newTitle,
        description: newDesc || undefined,
        due_date: dueDateTime.toISOString(),
        priority: newPriority,
        source_module: 'CUSTOM'
      });
      addToast('Reminder created!', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create reminder', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const activeReminders = reminders.filter(r => !r.is_completed);
  const completedReminders = reminders.filter(r => r.is_completed);
  const overdueCount = activeReminders.filter(r => r.is_overdue).length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <BellRing className="w-7 h-7 text-primary" />
            <span>Centralized Reminders</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {activeReminders.length} active • {overdueCount > 0 && <span className="text-rose-500 font-bold">{overdueCount} overdue • </span>}
            {completedReminders.length} completed
          </p>
        </div>

        <button
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setNewDueDate(tomorrow.toISOString().split('T')[0]);
            setIsModalOpen(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </button>
      </div>

      {/* Overdue Alert banner */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-500 text-xs font-semibold">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>You have {overdueCount} overdue reminder(s) requiring immediate action.</span>
        </div>
      )}

      {/* Active Reminders List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Active Reminders ({activeReminders.length})
        </h3>

        {activeReminders.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-3xl">
            🎉 All caught up! No pending reminders right now.
          </div>
        ) : (
          activeReminders.map(rem => {
            const isOver = rem.is_overdue;
            const dueDate = new Date(rem.due_date);

            return (
              <div
                key={rem.id}
                className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-4 group ${
                  isOver
                    ? 'bg-rose-500/5 border-rose-500/30 shadow-xs'
                    : 'bg-card border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggleReminder(rem)}
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <Circle className="w-5 h-5 group-hover:text-primary" />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                        {rem.title}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        rem.priority === 'URGENT'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                          : rem.priority === 'HIGH'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {rem.priority}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {rem.source_module}
                      </span>
                    </div>

                    {rem.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {rem.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[11px] mt-1.5 font-medium">
                      <span className={`flex items-center gap-1 ${isOver ? 'text-rose-500 font-bold' : 'text-muted-foreground'}`}>
                        <Clock className="w-3 h-3" />
                        Due: {dueDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSnooze(rem.id, 1)}
                    className="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1"
                    title="Snooze 1 day"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span className="hidden sm:inline">Snooze +1d</span>
                  </button>
                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completed Reminders Collapsible */}
      {completedReminders.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-border">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
            Completed Reminders ({completedReminders.length})
          </h3>
          <div className="space-y-2 opacity-60">
            {completedReminders.map(rem => (
              <div
                key={rem.id}
                className="p-3 rounded-2xl bg-secondary/30 border border-transparent flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => handleToggleReminder(rem)}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  </button>
                  <span className="line-through text-muted-foreground truncate">{rem.title}</span>
                </div>
                <button
                  onClick={() => handleDeleteReminder(rem.id)}
                  className="p-1 rounded-lg hover:text-rose-500 text-muted-foreground"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Reminder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Create Reminder</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReminder} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Reminder Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Renew passport, Pay electricity bill, Doctor appointment"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Context or notes..."
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Time</label>
                  <input
                    type="time"
                    value={newDueTime}
                    onChange={e => setNewDueTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={e => setNewPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent 🔴</option>
                </select>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-secondary font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Set Reminder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
