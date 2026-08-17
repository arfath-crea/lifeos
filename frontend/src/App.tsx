import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { AuthView } from './components/auth/AuthView';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { AICopilotDrawer } from './components/common/AICopilotDrawer';
import { ToastContainer } from './components/common/ToastContainer';

import { DashboardView } from './components/dashboard/DashboardView';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { NotesView } from './components/notes/NotesView';
import { StudyView } from './components/study/StudyView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { VaultView } from './components/vault/VaultView';
import { GoalsView } from './components/goals/GoalsView';
import { RemindersView } from './components/reminders/RemindersView';
import { SettingsView } from './components/settings/SettingsView';
import { Loader2 } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { activeView } = useLifeOS();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground font-semibold">Initializing LifeOS workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const renderActiveModule = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'notes':
        return <NotesView />;
      case 'study':
        return <StudyView />;
      case 'expenses':
        return <ExpensesView />;
      case 'vault':
        return <VaultView />;
      case 'goals':
        return <GoalsView />;
      case 'reminders':
        return <RemindersView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderActiveModule()}
        </main>
      </div>

      {/* Global Modals & Utilities */}
      <CommandPalette />
      <AICopilotDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LifeOSProvider>
        <MainLayout />
      </LifeOSProvider>
    </AuthProvider>
  );
}
