import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import {
  CalendarDays,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Trash2,
  CheckCircle2,
  Circle,
  Loader2,
  X
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast } = useLifeOS();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [calendarData, setCalendarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New Event Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState('Event');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('10:00');
  const [newLocation, setNewLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchCalendar();
  }, [currentDate, refreshKey]);

  const fetchCalendar = async () => {
    try {
      const res = await api.getIntegratedCalendar(currentDate.getMonth() + 1, currentDate.getFullYear());
      setCalendarData(res);
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${newDate}T${newTime}:00`);
      let color = '#3b82f6';
      if (newType === 'Exam') color = '#ef4444';
      if (newType === 'Meeting') color = '#8b5cf6';
      if (newType === 'Appointment') color = '#06b6d4';
      if (newType === 'Birthday') color = '#ec4899';

      await api.createEvent({
        title: newTitle,
        description: newDesc || undefined,
        event_type: newType,
        start_time: startDateTime.toISOString(),
        location: newLocation || undefined,
        color
      });

      addToast('Event scheduled!', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      setNewLocation('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create event', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      await api.deleteEvent(id);
      addToast('Event removed', 'info');
      triggerRefresh();
    } catch (err) {
      addToast('Failed to delete event', 'error');
    }
  };

  // Generate days for Month view
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday
    
    // Previous month filler days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month filler days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysList = getDaysInMonth();

  const getItemsForDay = (date: Date) => {
    if (!calendarData?.items) return [];
    const dateStr = date.toISOString().split('T')[0];
    return calendarData.items.filter((item: any) => {
      const itemDateStr = item.start_time.split('T')[0];
      return itemDateStr === dateStr;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-primary" />
            <span>Integrated Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Unified schedule combining events, exams, meetings, and task deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Navigation */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-2xl p-1 shadow-xs">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-bold text-foreground min-w-[120px] text-center">
              {monthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Event</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid (Month View) */}
      <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-border bg-secondary/30 text-center py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
          {daysList.map((dayObj, idx) => {
            const dayItems = getItemsForDay(dayObj.date);
            const isToday = new Date().toDateString() === dayObj.date.toDateString();

            return (
              <div
                key={idx}
                className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col justify-between transition-colors ${
                  dayObj.isCurrentMonth ? 'bg-card/40' : 'bg-secondary/15 opacity-40'
                } ${isToday ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-primary text-primary-foreground shadow-xs' : 'text-foreground'
                    }`}
                  >
                    {dayObj.date.getDate()}
                  </span>
                  {dayItems.length > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {dayItems.length}
                    </span>
                  )}
                </div>

                {/* Day's Event Badges */}
                <div className="space-y-1 mt-1 overflow-y-auto max-h-[85px] pr-0.5">
                  {dayItems.map((item: any) => {
                    const isTask = item.item_type === 'TASK_DEADLINE';
                    return (
                      <div
                        key={item.id}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold truncate flex items-center justify-between group cursor-pointer shadow-2xs"
                        style={{
                          backgroundColor: `${item.color}20`,
                          color: item.color,
                          border: `1px solid ${item.color}40`
                        }}
                        title={`${item.title} (${item.event_type})`}
                      >
                        <span className="truncate">{item.title}</span>
                        {!isTask && item.raw_id && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteEvent(item.raw_id);
                            }}
                            className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity ml-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Schedule Calendar Event</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Lab Exam"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Event Type</label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Exam">Exam 🔴</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Appointment">Appointment</option>
                    <option value="Birthday">Birthday</option>
                    <option value="Deadline">Deadline</option>
                    <option value="Event">General Event</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Location</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="e.g. Hall 4B or Zoom"
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Additional event details..."
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
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
                  <span>Schedule Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
