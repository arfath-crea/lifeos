import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Sparkles,
  ArrowRight,
  Lock,
  Mail,
  User as UserIcon,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Loader2
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, register, demoLogin, isLoading } = useAuth();
  const { addToast, fireConfetti } = useLifeOS();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setSubmitting(true);
    try {
      if (isRegister) {
        if (!fullName.trim()) {
          addToast('Full name is required', 'error');
          return;
        }
        await register({ email, password, full_name: fullName });
        addToast('Welcome to LifeOS!', 'success');
      } else {
        await login({ email, password });
        addToast('Welcome back to LifeOS!', 'success');
      }
      fireConfetti();
    } catch (err: any) {
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setSubmitting(true);
    try {
      await demoLogin();
      addToast('Logged in as Alex Mercer (Demo User)', 'success');
      fireConfetti();
    } catch (err: any) {
      addToast(err.message || 'Failed to start demo', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-primary/20">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-card border border-border shadow-2xl overflow-hidden animate-slide-up">
        {/* Left Hero Column */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white flex flex-col justify-between space-y-8 relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-base shadow-md">
                ⚡
              </div>
              <span className="text-xl font-extrabold tracking-tight">LifeOS</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black leading-tight">
              One platform for your daily tasks, schedule, study, & finances.
            </h2>

            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Say goodbye to fragmented apps. LifeOS connects your goals, coursework, calendar, and expenses with built-in artificial intelligence.
            </p>
          </div>

          {/* Feature Bullets */}
          <div className="space-y-2.5 text-xs text-blue-100/90 relative z-10 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Smart Unified Morning Briefing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Natural Language Input (&quot;Spent ₹250 on lunch&quot;)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Pomodoro Study Hub & AI Exam Scheduler</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Encrypted Document Vault & Expiry Reminders</span>
            </div>
          </div>

          <div className="relative z-10 text-[11px] text-blue-200/80">
            Privacy-First Architecture • Relational PostgreSQL Support
          </div>
        </div>

        {/* Right Form Column */}
        <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black text-foreground">
              {isRegister ? 'Create your LifeOS Account' : 'Welcome back'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRegister
                ? 'Get started in seconds with full data isolation.'
                : 'Enter your credentials or click instant demo below.'}
            </p>
          </div>

          {/* Demo Button */}
          <button
            type="button"
            onClick={handleDemo}
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs group"
          >
            <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span>One-Click Instant Demo (Alex Mercer)</span>
          </button>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex-1 h-px bg-border" />
            <span>or continue with email</span>
            <span className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {isRegister && (
              <div>
                <label className="block font-semibold mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="alex@lifeos.dev"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-primary/25 transition-all mt-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Sign Up' : 'Log In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="text-center pt-2 text-xs text-muted-foreground">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="font-bold text-primary hover:underline"
            >
              {isRegister ? 'Log In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
