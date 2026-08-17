import React from 'react';
import { useLifeOS, ActiveView } from '../../context/LifeOSContext';
import {
  LayoutDashboard,
  CheckSquare2,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Wallet,
  ShieldCheck,
  Target,
  BellRing,
  Sliders,
  Sparkles
} from 'lucide-react';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare2 },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'study', label: 'Study System', icon: GraduationCap, badge: 'Pomodoro' },
  { id: 'expenses', label: 'Expenses', icon: Wallet },
  { id: 'vault', label: 'Document Vault', icon: ShieldCheck },
  { id: 'goals', label: 'Goals & Milestones', icon: Target },
  { id: 'reminders', label: 'Reminders', icon: BellRing },
];

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, setIsAICopilotOpen } = useLifeOS();

  return (
    <aside className="w-64 border-r border-border bg-card/40 backdrop-blur-sm flex flex-col justify-between shrink-0 min-h-[calc(100vh-57px)] p-3 select-none">
      {/* Main Nav Links */}
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
            Modules
          </p>
          <nav className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-black/20 text-white'
                        : 'bg-primary/10 text-primary border border-primary/20'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* AI Copilot Quick Callout */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-primary/20 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-primary font-bold mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Copilot Active</span>
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed mb-3">
            Type anything in plain English or press <kbd className="px-1 py-0.5 font-mono text-[10px] bg-card border rounded">Ctrl+J</kbd> to converse.
          </p>
          <button
            onClick={() => setIsAICopilotOpen(true)}
            className="w-full py-1.5 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all text-center shadow-xs"
          >
            Launch Assistant
          </button>
        </div>
      </div>

      {/* Footer / System status */}
      <div className="pt-3 border-t border-border/80 px-2 flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium">System Online</span>
        </div>
        <span className="font-mono text-[10px] opacity-70">v1.0.0</span>
      </div>
    </aside>
  );
};
