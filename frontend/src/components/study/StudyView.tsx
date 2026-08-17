import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { sendBrowserNotification } from '../../utils/browserNotifications';
import { Subject, Topic, StudySession } from '../../types';
import {
  GraduationCap,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Plus,
  BookOpen,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Loader2,
  X
} from 'lucide-react';

export const StudyView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast, fireConfetti } = useLifeOS();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  // Pomodoro Timer State
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

  // AI Study Plan State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planSubjectId, setPlanSubjectId] = useState<number | ''>('');
  const [planExamDate, setPlanExamDate] = useState('');
  const [planHours, setPlanHours] = useState(2);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [isPlanning, setIsPlanning] = useState(false);

  // Add Subject Modal
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');
  const [newSubExamDate, setNewSubExamDate] = useState('');

  // Add Topic Modal
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDifficulty, setNewTopicDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');

  useEffect(() => {
    fetchStudyData();
  }, [refreshKey]);

  const fetchStudyData = async () => {
    try {
      const [subsRes, sessRes] = await Promise.all([
        api.getSubjects(),
        api.getStudySessions()
      ]);
      setSubjects(subsRes);
      setSessions(sessRes);
      if (!selectedSubject && subsRes.length > 0) {
        setSelectedSubject(subsRes[0]);
      } else if (selectedSubject) {
        const still = subsRes.find(s => s.id === selectedSubject.id);
        if (still) setSelectedSubject(still);
      }
    } catch (err) {
      console.error('Failed to load study data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      setIsRunning(false);
      fireConfetti();
      
      const alertTitle = timerMode === 'work' ? '⏰ Pomodoro Sprint Finished!' : '☕ Break Time Over!';
      const alertBody = timerMode === 'work' ? 'Great focus! Logged 25m study session. Take a 5m break.' : 'Ready to resume your study sprint?';
      
      sendBrowserNotification(alertTitle, {
        body: alertBody,
        playSound: true
      });

      addToast(alertBody, 'success');

      // Auto-log session
      if (timerMode === 'work') {
        api.logStudySession({
          subject_id: selectedSubject?.id,
          topic_id: selectedTopicId || undefined,
          duration_minutes: 25,
          session_type: 'pomodoro',
          notes: 'Completed 25-minute Pomodoro study sprint'
        }).then(() => triggerRefresh());
        setTimerMode('break');
        setTimeLeft(5 * 60);
      } else {
        setTimerMode('work');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerMode]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpdateMastery = async (topicId: number, percentage: number) => {
    try {
      await api.updateTopic(topicId, { mastery_percentage: percentage });
      triggerRefresh();
    } catch {
      addToast('Failed to update topic mastery', 'error');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    try {
      await api.createSubject({
        name: newSubName,
        code: newSubCode || undefined,
        exam_date: newSubExamDate ? new Date(newSubExamDate).toISOString() : undefined,
        target_hours: 20
      });
      addToast('Subject added!', 'success');
      setIsSubjectModalOpen(false);
      setNewSubName('');
      setNewSubCode('');
      setNewSubExamDate('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create subject', 'error');
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject || !newTopicName.trim()) return;
    try {
      await api.addTopic(selectedSubject.id, {
        name: newTopicName,
        difficulty: newTopicDifficulty,
        mastery_percentage: 0
      });
      addToast('Topic added!', 'success');
      setIsTopicModalOpen(false);
      setNewTopicName('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to add topic', 'error');
    }
  };

  const handleGenerateStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planSubjectId || !planExamDate) return;
    setIsPlanning(true);
    try {
      const res = await api.generateStudyPlan(
        Number(planSubjectId),
        new Date(planExamDate).toISOString(),
        Number(planHours)
      );
      setGeneratedPlan(res);
      addToast('AI study schedule generated!', 'success');
      fireConfetti();
    } catch (err: any) {
      addToast(err.message || 'Failed to generate study plan', 'error');
    } finally {
      setIsPlanning(false);
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
      {/* Header & Planning Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-primary" />
            <span>Study System & Mastery</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Topic mastery tracker, Pomodoro sprints, and AI automated exam scheduler.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setPlanSubjectId(selectedSubject?.id || '');
              setIsPlanModalOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 text-primary border border-primary/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span>AI Exam Planner</span>
          </button>
          <button
            onClick={() => setIsSubjectModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Pomodoro Timer & Subject Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (4 cols): Pomodoro Sprint Widget */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-6 rounded-3xl bg-card border border-border shadow-xs flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {timerMode === 'work' ? '🧠 Deep Study Sprint' : '☕ Rest & Refresh'}
              </p>
            </div>

            {/* Big Countdown Timer */}
            <div className="my-2 p-8 rounded-3xl bg-secondary/40 border border-border/80 w-full flex flex-col items-center">
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-foreground">
                {formatTimer(timeLeft)}
              </span>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {timerMode === 'work' ? 'Focus without distractions' : 'Stretch, hydrate, breathe'}
              </p>
            </div>

            {/* Subject Selector for Timer */}
            <div className="w-full text-left space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Active Focus Topic</label>
              <select
                value={selectedTopicId || ''}
                onChange={e => setSelectedTopicId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-xl bg-secondary/60 border border-border text-xs text-foreground focus:outline-none"
              >
                <option value="">General Study / No specific topic</option>
                {selectedSubject?.topics?.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.mastery_percentage}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex-1 py-3 rounded-2xl font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
                  isRunning
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/25'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start 25m Sprint</span>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setTimeLeft(timerMode === 'work' ? 25 * 60 : 5 * 60);
                }}
                className="p-3 rounded-2xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-all"
                title="Reset Timer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recent Study Sessions */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Recent Study Sessions
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No logged sessions yet</p>
              ) : (
                sessions.map(s => (
                  <div key={s.id} className="p-2.5 rounded-xl bg-secondary/40 border border-border/60 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-foreground">{s.subject_name || 'Study Session'}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{s.notes || s.session_type}</p>
                    </div>
                    <span className="font-bold text-primary">{s.duration_minutes}m</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (8 cols): Subject & Topic Mastery breakdown */}
        <div className="lg:col-span-8 space-y-5">
          {/* Subject Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
                  selectedSubject?.id === s.id
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{s.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-black/20 text-white">
                  {s.overall_mastery || 0}%
                </span>
              </button>
            ))}
          </div>

          {selectedSubject ? (
            <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-6">
              {/* Subject Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-foreground">{selectedSubject.name}</h3>
                    {selectedSubject.code && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {selectedSubject.code}
                      </span>
                    )}
                  </div>
                  {selectedSubject.exam_date && (
                    <p className="text-xs text-rose-500 font-semibold mt-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Exam Date: {new Date(selectedSubject.exam_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Overall Mastery</p>
                    <p className="text-2xl font-black text-primary">{selectedSubject.overall_mastery || 0}%</p>
                  </div>
                  <button
                    onClick={() => setIsTopicModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Topic
                  </button>
                </div>
              </div>

              {/* Topics Breakdown */}
              <div className="space-y-3.5">
                {selectedSubject.topics.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground">
                    No topics created for this subject yet. Click &quot;Add Topic&quot; to begin tracking mastery.
                  </div>
                ) : (
                  selectedSubject.topics.map(topic => (
                    <div
                      key={topic.id}
                      className="p-4 rounded-2xl bg-secondary/40 border border-border/70 space-y-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {topic.mastery_percentage >= 100 ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                          <span className="font-bold text-xs text-foreground truncate">{topic.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            topic.difficulty === 'HARD' ? 'bg-rose-500/10 text-rose-500' : topic.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {topic.difficulty}
                          </span>
                          <span className="text-xs font-black text-primary min-w-[40px] text-right">
                            {topic.mastery_percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Mastery Bar & Slider */}
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={topic.mastery_percentage}
                          onChange={e => handleUpdateMastery(topic.id, Number(e.target.value))}
                          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-3xl">
              Select or create a subject to view topics and mastery progress.
            </div>
          )}
        </div>
      </div>

      {/* AI Study Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">AI Exam Study Scheduler</h3>
              </div>
              <button onClick={() => setIsPlanModalOpen(false)} className="p-1.5 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerateStudyPlan} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Subject *</label>
                <select
                  required
                  value={planSubjectId}
                  onChange={e => setPlanSubjectId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select subject...</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Exam Date *</label>
                <input
                  type="date"
                  required
                  value={planExamDate}
                  onChange={e => setPlanExamDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Daily Study Hours</label>
                <input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={planHours}
                  onChange={e => setPlanHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  disabled={isPlanning}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md"
                >
                  {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Generate Day-by-Day Revision Roadmap</span>
                </button>
              </div>
            </form>

            {/* Generated Plan Breakdown */}
            {generatedPlan && (
              <div className="mt-4 p-4 rounded-2xl bg-secondary/40 border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm text-foreground">
                    📅 {generatedPlan.days_remaining}-Day Roadmap for {generatedPlan.subject_name}
                  </h4>
                  <span className="text-[11px] font-bold text-primary">
                    {generatedPlan.daily_target_hours}h daily ({generatedPlan.schedule[0]?.recommended_pomodoros || 4} pomodoros)
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {generatedPlan.schedule?.map((item: any) => (
                    <div
                      key={item.day_number}
                      className={`p-3 rounded-xl border text-xs ${
                        item.is_exam_eve
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-100'
                          : 'bg-card border-border/80 text-foreground'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>Day {item.day_number} ({item.date_display})</span>
                        <span className="text-[10px] font-semibold opacity-75">{item.recommended_pomodoros} Pomodoro Sprints</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{item.focus}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Add New Subject</h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  placeholder="e.g. Operating Systems"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubCode}
                  onChange={e => setNewSubCode(e.target.value)}
                  placeholder="e.g. CS-304"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Exam Date (Optional)</label>
                <input
                  type="date"
                  value={newSubExamDate}
                  onChange={e => setNewSubExamDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsSubjectModalOpen(false)} className="px-3.5 py-2 rounded-xl bg-secondary font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold">
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Topic Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Add Topic to {selectedSubject?.name}</h3>
              <button onClick={() => setIsTopicModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTopic} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Topic Name *</label>
                <input
                  type="text"
                  required
                  value={newTopicName}
                  onChange={e => setNewTopicName(e.target.value)}
                  placeholder="e.g. Process Scheduling Algorithms"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Difficulty</label>
                <select
                  value={newTopicDifficulty}
                  onChange={e => setNewTopicDifficulty(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsTopicModalOpen(false)} className="px-3.5 py-2 rounded-xl bg-secondary font-semibold">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold">
                  Add Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
