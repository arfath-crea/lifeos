import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export type ActiveView = 
  | 'dashboard'
  | 'tasks'
  | 'calendar'
  | 'notes'
  | 'study'
  | 'expenses'
  | 'vault'
  | 'goals'
  | 'reminders'
  | 'settings';

interface Toast {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface LifeOSContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAICopilotOpen: boolean;
  setIsAICopilotOpen: (open: boolean) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  fireConfetti: () => void;
}

const LifeOSContext = createContext<LifeOSContextType | undefined>(undefined);

export const LifeOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899']
      });
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut listener for Ctrl+K (or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setIsAICopilotOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <LifeOSContext.Provider
      value={{
        activeView,
        setActiveView,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isAICopilotOpen,
        setIsAICopilotOpen,
        refreshKey,
        triggerRefresh,
        toasts,
        addToast,
        removeToast,
        fireConfetti
      }}
    >
      {children}
    </LifeOSContext.Provider>
  );
};

export const useLifeOS = () => {
  const context = useContext(LifeOSContext);
  if (!context) throw new Error('useLifeOS must be used within a LifeOSProvider');
  return context;
};
