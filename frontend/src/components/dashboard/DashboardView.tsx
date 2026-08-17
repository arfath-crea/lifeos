import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { DashboardSummary, Task } from '../../types';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Wallet,
  Target,
  ArrowRight,
  Send,
  Loader2,
  Clock,
  AlertCircle,
  CheckSquare,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh, addToast, fireConfetti, setActiveView, setIsAICopilotOpen } = useLifeOS();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [nlInput, setNlInput] = useState('');
  const [nlLoading, setNlLoading] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [refreshKey]);

  const handleToggleTask = async (task: Task) => {
    try {
      await api.toggleTask(task.id);
      if (task.status !== 'COMPLETED') {
        fireConfetti();
        addToast(`Completed "${task.title}"!`, 'success');
      }
      triggerRefresh();
    } catch (err) {
      addToast('Failed to update task', 'error');
    }
  };

  const handleExecuteNL = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlInput.trim() || nlLoading) return;
    setNlLoading(true);
    try {
      const res = await api.executeCommand(nlInput, true);
      addToast(res.response_message, 'success');
      fireConfetti();
      setNlInput('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Error parsing command', 'error');
    } finally {
      setNlLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Synthesizing LifeOS dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header & Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {data.greeting}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {data.date_str} • Here is what needs your attention today.
          </p>
        </div>

        {/* Quick Natural Language Action Bar */}
        <form onSubmit={handleExecuteNL} className="w-full md:w-auto flex-1 max-w-lg">
          <div className="relative flex items-center">
            <input
              type="text"
              value={nlInput}
              onChange={e => setNlInput(e.target.value)}
              placeholder="Natural Language Quick Add (e.g. 'Spent ₹350 on lunch', 'Remind me to study Java tomorrow')..."
              className="w-full pl-3.5 pr-20 py-2.5 rounded-2xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary shadow-xs transition-all"
            />
            <button
              type="submit"
              disabled={!nlInput.trim() || nlLoading}
              className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold disabled:opacity-40 transition-all flex items-center gap-1 shadow-xs"
            >
              {nlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {data.metrics.map((metric, idx) => {
          const getColor = () => {
            switch (metric.color) {
              case 'emerald': return 'from-emerald-500/10 to-teal-500/5 text-emerald-500 border-emerald-500/20';
              case 'blue': return 'from-blue-500/10 to-indigo-500/5 text-blue-500 border-blue-500/20';
              case 'rose': return 'from-rose-500/10 to-pink-500/5 text-rose-500 border-rose-500/20';
              case 'purple': return 'from-purple-500/10 to-violet-500/5 text-purple-500 border-purple-500/20';
              default: return 'from-amber-500/10 to-orange-500/5 text-amber-500 border-amber-500/20';
            }
          };

          return (
            <div
              key={idx}
              className={`p-4 rounded-2xl bg-gradient-to-br border bg-card/60 shadow-xs backdrop-blur-xs flex flex-col justify-between ${getColor()}`}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {metric.label}
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
                  {metric.value}
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 font-medium">
                {metric.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* AI Daily Briefing & Insights Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 border border-primary/25 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-foreground">
                LifeOS Intelligent Briefing
              </h3>
              <button
                onClick={() => setIsAICopilotOpen(true)}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Ask Copilot</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {data.ai_briefing}
            </p>
            {data.ai_insights.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {data.ai_insights.map((ins, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-card/80 border border-border/80 text-[11px] text-muted-foreground flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{ins}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Tasks & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Priority Tasks */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Priority Tasks
                </h3>
              </div>
              <button
                onClick={() => setActiveView('tasks')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>View All Tasks</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {data.priority_tasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  🎉 No urgent tasks remaining! You are all caught up.
                </div>
              ) : (
                data.priority_tasks.map(task => {
                  const isCompleted = task.status === 'COMPLETED';
                  return (
                    <div
                      key={task.id}
                      className={`group p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                        isCompleted
                          ? 'bg-secondary/30 border-transparent opacity-60'
                          : 'bg-secondary/50 hover:bg-secondary border-border/70 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task)}
                          className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              task.priority === 'URGENT'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : task.priority === 'HIGH'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {task.category}
                            </span>
                            {task.subtasks.length > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                • {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length} subtasks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Goals Strip */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Active Long-Term Goals
                </h3>
              </div>
              <button
                onClick={() => setActiveView('goals')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <span>All Goals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {data.active_goals.map(goal => (
                <div key={goal.id} className="p-3 rounded-2xl bg-secondary/40 border border-border/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{goal.title}</span>
                    <span className="font-bold text-primary">{goal.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Upcoming Calendar & Reminders */}
        <div className="lg:col-span-5 space-y-4">
          {/* Upcoming Schedule */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Upcoming 7 Days
                </h3>
              </div>
              <button
                onClick={() => setActiveView('calendar')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Calendar
              </button>
            </div>

            <div className="space-y-2.5">
              {data.upcoming_events.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No upcoming calendar events for the next 7 days.
                </div>
              ) : (
                data.upcoming_events.map(ev => {
                  const evDate = new Date(ev.start_time);
                  const isExam = ev.event_type === 'Exam';
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl bg-secondary/40 border border-border/70 flex items-start gap-3 text-xs"
                    >
                      <div className={`px-2.5 py-1.5 rounded-xl text-center shrink-0 ${
                        isExam ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        <p className="text-[10px] font-bold uppercase">{evDate.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                        <p className="text-sm font-extrabold">{evDate.getDate()}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{ev.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {evDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} • {ev.event_type}
                        </p>
                        {ev.location && (
                          <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5">📍 {ev.location}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Centralized Reminders Preview */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
                  Pending Reminders
                </h3>
              </div>
              <button
                onClick={() => setActiveView('reminders')}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Reminders
              </button>
            </div>

            <div className="space-y-2">
              {data.pending_reminders.length === 0 ? (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  No active reminders.
                </div>
              ) : (
                data.pending_reminders.map(rem => (
                  <div key={rem.id} className="p-2.5 rounded-xl bg-secondary/40 border border-border/70 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span className="font-medium text-foreground truncate">{rem.title}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                      {new Date(rem.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
