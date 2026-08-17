import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { Task, Priority, TaskStatus } from '../../types';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Tag,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

export const TasksView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast, fireConfetti } = useLifeOS();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [expandedTasks, setExpandedTasks] = useState<Record<number, boolean>>({});
  
  // New Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newCategory, setNewCategory] = useState('Academics');
  const [newDueDate, setNewDueDate] = useState('');
  const [newSubtasks, setNewSubtasks] = useState<string[]>(['']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [refreshKey]);

  const fetchTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      const res = await api.toggleTask(task.id);
      if (res.status === 'COMPLETED') {
        fireConfetti();
        addToast(`Completed "${task.title}"!`, 'success');
      }
      triggerRefresh();
    } catch (err) {
      addToast('Failed to update task', 'error');
    }
  };

  const handleToggleSubtask = async (taskId: number, subtaskId: number) => {
    try {
      await api.toggleSubtask(taskId, subtaskId);
      triggerRefresh();
    } catch (err) {
      addToast('Failed to update subtask', 'error');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await api.deleteTask(taskId);
      addToast('Task removed', 'info');
      triggerRefresh();
    } catch (err) {
      addToast('Failed to delete task', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const subs = newSubtasks.filter(s => s.trim()).map(s => ({ title: s.trim(), is_completed: false }));
      await api.createTask({
        title: newTitle,
        description: newDesc || undefined,
        priority: newPriority,
        category: newCategory,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : undefined,
        subtasks: subs
      });
      addToast('Task created successfully!', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewDueDate('');
      setNewSubtasks(['']);
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create task', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (taskId: number) => {
    setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED');

  // Stats
  const totalCompleted = tasks.filter(t => t.status === 'COMPLETED').length;
  const completionRate = tasks.length > 0 ? Math.round((totalCompleted / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const renderTaskCard = (task: Task) => {
    const isCompleted = task.status === 'COMPLETED';
    const isExpanded = expandedTasks[task.id];
    return (
      <div
        key={task.id}
        className={`group p-4 rounded-2xl border transition-all ${
          isCompleted
            ? 'bg-secondary/30 border-transparent opacity-70'
            : 'bg-card border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => handleToggleTask(task)}
              className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <h4 className={`text-xs sm:text-sm font-semibold ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  task.priority === 'URGENT'
                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                    : task.priority === 'HIGH'
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    : task.priority === 'MEDIUM'
                    ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                }`}>
                  {task.priority}
                </span>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
                  {task.category}
                </span>

                {task.due_date && (
                  <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {task.subtasks.length > 0 && (
              <button
                onClick={() => toggleExpand(task.id)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                title="Toggle Subtasks"
              >
                <span className="text-[10px] font-semibold">
                  {task.subtasks.filter(s => s.is_completed).length}/{task.subtasks.length}
                </span>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            )}
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Subtasks Checklist */}
        {isExpanded && task.subtasks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/60 pl-8 space-y-1.5 animate-slide-up">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Subtasks Tree
            </p>
            {task.subtasks.map(sub => (
              <div
                key={sub.id}
                onClick={() => handleToggleSubtask(task.id, sub.id)}
                className="flex items-center gap-2 text-xs py-1 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {sub.is_completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                )}
                <span className={sub.is_completed ? 'line-through text-muted-foreground/80' : 'text-foreground'}>
                  {sub.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Task Management Hub
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {tasks.length - totalCompleted} remaining • {totalCompleted} completed • {completionRate}% completion rate
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Board / List switcher */}
          <div className="p-1 rounded-xl bg-secondary/80 border border-border flex items-center gap-1">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'board' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'list' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          {/* New Task Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* TODO Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  To Do ({todoTasks.length})
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              {todoTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
                  No tasks to do
                </div>
              ) : (
                todoTasks.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  In Progress ({inProgressTasks.length})
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              {inProgressTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
                  No tasks in progress
                </div>
              ) : (
                inProgressTasks.map(renderTaskCard)
              )}
            </div>
          </div>

          {/* COMPLETED Column */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground">
                  Completed ({completedTasks.length})
                </h3>
              </div>
            </div>
            <div className="space-y-3">
              {completedTasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground border border-dashed border-border/80 rounded-2xl">
                  No completed tasks
                </div>
              ) : (
                completedTasks.map(renderTaskCard)
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-xs text-muted-foreground">
              No tasks found.
            </div>
          ) : (
            filteredTasks.map(renderTaskCard)
          )}
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Create New Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Submit Distributed Systems Assignment"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Details, requirements, or links..."
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Priority</label>
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

                <div>
                  <label className="block font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Academics">Academics</option>
                    <option value="Career">Career</option>
                    <option value="Personal">Personal</option>
                    <option value="Finance">Finance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Subtasks Builder */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-foreground">Subtasks (Breakdown)</label>
                  <button
                    type="button"
                    onClick={() => setNewSubtasks(prev => [...prev, ''])}
                    className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Subtask
                  </button>
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {newSubtasks.map((sub, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sub}
                        onChange={e => {
                          const val = e.target.value;
                          setNewSubtasks(prev => prev.map((s, i) => i === idx ? val : s));
                        }}
                        placeholder={`Subtask ${idx + 1}...`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border text-xs text-foreground focus:outline-none"
                      />
                      {newSubtasks.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNewSubtasks(prev => prev.filter((_, i) => i !== idx))}
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
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Create Task</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
