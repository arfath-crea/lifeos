import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { Goal, Milestone } from '../../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  ArrowRight,
  Trash2,
  ChevronRight,
  TrendingUp,
  Award,
  Loader2,
  X
} from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast, fireConfetti } = useLifeOS();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  // New Goal Modal
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Career');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newMilestones, setNewMilestones] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Milestone Modal
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  useEffect(() => {
    fetchGoals();
  }, [refreshKey]);

  const fetchGoals = async () => {
    try {
      const res = await api.getGoals();
      setGoals(res);
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ms = newMilestones.filter(m => m.trim()).map((m, idx) => ({
        title: m.trim(),
        is_completed: false,
        progress_percentage: 0,
        order_index: idx
      }));

      await api.createGoal({
        title: newTitle,
        description: newDesc || undefined,
        category: newCategory,
        target_date: newTargetDate ? new Date(newTargetDate).toISOString() : undefined,
        status: 'ACTIVE',
        milestones: ms
      });

      addToast('Long-term goal established!', 'success');
      setIsGoalModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewMilestones(['']);
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create goal', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMilestone = async (goal: Goal, milestone: Milestone) => {
    try {
      const isNowCompleted = !milestone.is_completed;
      await api.updateMilestone(milestone.id, {
        is_completed: isNowCompleted,
        progress_percentage: isNowCompleted ? 100 : 0
      });
      if (isNowCompleted) {
        fireConfetti();
        addToast(`Milestone achieved: "${milestone.title}"!`, 'success');
      }
      triggerRefresh();
    } catch {
      addToast('Failed to update milestone', 'error');
    }
  };

  const handleCreateTaskFromMilestone = async (milestoneId: number, title: string) => {
    try {
      await api.createTaskFromMilestone(milestoneId);
      addToast(`Action task created for: "${title}"`, 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to generate task', 'error');
    }
  };

  const handleDeleteGoal = async (id: number) => {
    try {
      await api.deleteGoal(id);
      addToast('Goal removed', 'info');
      triggerRefresh();
    } catch {
      addToast('Failed to delete goal', 'error');
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !newMilestoneTitle.trim()) return;
    try {
      await api.addMilestone(selectedGoalId, {
        title: newMilestoneTitle.trim(),
        is_completed: false,
        progress_percentage: 0
      });
      addToast('Milestone added!', 'success');
      setSelectedGoalId(null);
      setNewMilestoneTitle('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to add milestone', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Target className="w-7 h-7 text-primary" />
            <span>Goals & Milestone Engine</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Bridge long-term vision with daily actionable tasks and milestone tracking.
          </p>
        </div>

        <button
          onClick={() => setIsGoalModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Cards List */}
      <div className="space-y-5">
        {goals.length === 0 ? (
          <div className="text-center py-16 text-xs text-muted-foreground bg-card border border-border rounded-3xl">
            No goals tracked yet. Establish your first long-term goal and connect milestones to daily actions!
          </div>
        ) : (
          goals.map(goal => {
            const completedCount = goal.milestones.filter(m => m.is_completed).length;
            const isGoalComplete = goal.progress_percentage >= 100;

            return (
              <div
                key={goal.id}
                className="p-6 rounded-3xl bg-card border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all space-y-5 group"
              >
                {/* Goal Top Banner */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                        {goal.category}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-foreground truncate">
                        {goal.title}
                      </h3>
                      {isGoalComplete && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ACHIEVED 🎉
                        </span>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progress</p>
                      <p className="text-2xl font-black text-primary">{goal.progress_percentage}%</p>
                    </div>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="p-2 rounded-xl hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-500 rounded-full"
                      style={{ width: `${goal.progress_percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{completedCount} of {goal.milestones.length} milestones complete</span>
                    {goal.target_date && (
                      <span>Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    )}
                  </div>
                </div>

                {/* Milestones Checklist */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Actionable Milestones
                    </p>
                    <button
                      onClick={() => setSelectedGoalId(goal.id)}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Milestone
                    </button>
                  </div>

                  <div className="space-y-2">
                    {goal.milestones.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No milestones defined for this goal yet.</p>
                    ) : (
                      goal.milestones.map(ms => (
                        <div
                          key={ms.id}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                            ms.is_completed
                              ? 'bg-secondary/20 border-transparent opacity-75'
                              : 'bg-secondary/50 border-border/70 shadow-2xs hover:bg-secondary/80'
                          }`}
                        >
                          <div
                            onClick={() => handleToggleMilestone(goal, ms)}
                            className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                          >
                            {ms.is_completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                            )}
                            <span className={`font-semibold truncate ${ms.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {ms.title}
                            </span>
                          </div>

                          {!ms.is_completed && (
                            <button
                              onClick={() => handleCreateTaskFromMilestone(ms.id, ms.title)}
                              className="px-2.5 py-1 rounded-lg bg-card hover:bg-primary hover:text-primary-foreground border border-border text-[10px] font-bold text-muted-foreground transition-all flex items-center gap-1 shrink-0"
                              title="Generate actionable task for this milestone"
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>Create Task</span>
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Set Long-Term Goal</h3>
              <button onClick={() => setIsGoalModalOpen(false)} className="p-1.5 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">Goal Vision / Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Become a Software Engineer, Score 9+ GPA"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Description & Strategy</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Why this goal matters and your high-level approach..."
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Career">Career</option>
                    <option value="Education">Education</option>
                    <option value="Health">Health</option>
                    <option value="Finance">Finance</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Target Horizon</label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={e => setNewTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Milestones input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold">Milestones Roadmap</label>
                  <button
                    type="button"
                    onClick={() => setNewMilestones(prev => [...prev, ''])}
                    className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Milestone
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {newMilestones.map((ms, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={ms}
                        onChange={e => {
                          const val = e.target.value;
                          setNewMilestones(prev => prev.map((m, i) => i === idx ? val : m));
                        }}
                        placeholder={`Milestone ${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
                      />
                      {newMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewMilestones(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsGoalModalOpen(false)} className="px-4 py-2 rounded-xl bg-secondary font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Establish Goal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Milestone Modal */}
      {selectedGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Add Milestone</h3>
              <button onClick={() => setSelectedGoalId(null)} className="p-1.5 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Milestone Title *</label>
                <input
                  type="text"
                  required
                  value={newMilestoneTitle}
                  onChange={e => setNewMilestoneTitle(e.target.value)}
                  placeholder="e.g. Master React & Tailwind"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedGoalId(null)} className="px-3.5 py-2 rounded-xl bg-secondary font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold">
                  Add Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
