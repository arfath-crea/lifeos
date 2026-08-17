import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { NotificationItem } from '../../types';
import { requestNotificationPermission } from '../../utils/browserNotifications';
import {
  Search,
  Sparkles,
  Bell,
  Sun,
  Moon,
  LogOut,
  Download,
  CheckCircle2
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const { setIsCommandPaletteOpen, setIsAICopilotOpen, refreshKey } = useLifeOS();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for PWA install prompt
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('To install LifeOS on your device:\n• iOS: Tap Share -> "Add to Home Screen"\n• Android/Chrome: Tap 3 dots -> "Install App"');
    }
  };

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await api.getNotifications();
        setNotifications(notifs);
        const countRes = await api.getUnreadNotificationsCount();
        setUnreadCount(countRes.unread_count);
      } catch {
        // ignore
      }
    };
    if (user) {
      fetchNotifs();
    }
  }, [user, refreshKey]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 py-3 flex items-center justify-between transition-colors">
      {/* Left: Brand / Quick Search */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold text-sm">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-foreground text-base">LifeOS</span>
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                AI Powered
              </span>
            </div>
          </div>
        </div>

        {/* Universal Search Bar Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="hidden md:flex items-center gap-3 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-secondary/70 hover:bg-secondary border border-border/80 rounded-xl transition-all w-64 justify-between group shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Search or command anything...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-background border border-border rounded shadow-xs text-muted-foreground">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Install App (PWA) Button */}
        <button
          onClick={handleInstallClick}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary/80 hover:bg-secondary border border-border text-foreground transition-all shadow-2xs"
          title="Install LifeOS as desktop/mobile app"
        >
          <Download className="w-3.5 h-3.5 text-primary" />
          <span>Install App</span>
        </button>

        {/* AI Copilot Button */}
        <button
          onClick={() => setIsAICopilotOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 text-primary border border-primary/30 transition-all shadow-xs group"
          title="Open LifeOS AI Copilot (Ctrl+J)"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">AI Copilot</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-transparent hover:border-border transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-card animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card shadow-2xl p-4 animate-fade-in z-50">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm text-foreground">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => !n.is_read && handleMarkRead(n.id)}
                      className={`p-3 rounded-xl border text-xs transition-all cursor-pointer ${
                        n.is_read
                          ? 'bg-secondary/30 border-transparent text-muted-foreground opacity-75'
                          : 'bg-secondary/80 border-border text-foreground font-medium shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-foreground">{n.title}</span>
                        {!n.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="mt-1 text-muted-foreground leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 border border-transparent hover:border-border transition-all"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(prev => !prev)}
            className="flex items-center gap-2 pl-2 pr-1 sm:pr-3 py-1 rounded-xl hover:bg-secondary/80 border border-transparent hover:border-border transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-foreground leading-none truncate max-w-[100px]">
                {user?.full_name?.split(' ')[0]}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[100px]">
                {user?.email}
              </p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-2xl p-2 animate-fade-in z-50">
              <div className="px-3 py-2 border-b border-border mb-1">
                <p className="text-xs font-semibold text-foreground">{user?.full_name}</p>
                <p className="text-[11px] text-muted-foreground">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Monthly Budget: {user?.currency}{user?.monthly_budget?.toLocaleString()}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
