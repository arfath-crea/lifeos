import React from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useLifeOS();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
            case 'warning':
              return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
            case 'error':
              return <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
            default:
              return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
          }
        };

        const getBorder = () => {
          switch (toast.type) {
            case 'success': return 'border-emerald-500/30 bg-emerald-950/80 dark:bg-emerald-950/90 text-emerald-100';
            case 'warning': return 'border-amber-500/30 bg-amber-950/80 dark:bg-amber-950/90 text-amber-100';
            case 'error': return 'border-rose-500/30 bg-rose-950/80 dark:bg-rose-950/90 text-rose-100';
            default: return 'border-blue-500/30 bg-slate-900/90 dark:bg-slate-900/95 text-slate-100';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-xl border backdrop-blur-md shadow-2xl animate-slide-up ${getBorder()}`}
          >
            <div className="flex items-center gap-3 pr-2">
              {getIcon()}
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
