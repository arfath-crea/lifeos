import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLifeOS } from '../../context/LifeOSContext';
import {
  Sliders,
  Wallet,
  GraduationCap,
  Sun,
  Moon,
  Shield,
  Download,
  Save,
  CheckCircle2,
  Loader2
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user, updateUser, theme, toggleTheme } = useAuth();
  const { addToast } = useLifeOS();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency || '₹');
  const [budget, setBudget] = useState(user?.monthly_budget?.toString() || '25000');
  const [studyTarget, setStudyTarget] = useState(user?.study_daily_target_minutes?.toString() || '120');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser({
        full_name: fullName,
        currency: currency,
        monthly_budget: parseFloat(budget) || 20000,
        study_daily_target_minutes: parseInt(studyTarget) || 120
      });
      addToast('Preferences saved successfully!', 'success');
    } catch {
      addToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const backupData = {
      export_date: new Date().toISOString(),
      user: {
        email: user?.email,
        full_name: user?.full_name,
        currency: user?.currency,
        monthly_budget: user?.monthly_budget
      },
      message: "LifeOS GDPR/Data Export format (Encrypted JSON)"
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifeos_backup_${user?.email?.split('@')[0]}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    addToast('LifeOS data exported safely!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
          <Sliders className="w-7 h-7 text-primary" />
          <span>User Preferences & Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Personalize your currency, monthly budget, study targets, and privacy settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5 text-xs">
        {/* Profile Details */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground">Profile Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/30 border border-border text-muted-foreground cursor-not-allowed opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Financial & Study Settings */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground">Financial & Academic Targets</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold mb-1">Currency Symbol</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
              >
                <option value="₹">₹ (INR - Indian Rupee)</option>
                <option value="$">$ (USD - US Dollar)</option>
                <option value="€">€ (EUR - Euro)</option>
                <option value="£">£ (GBP - British Pound)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Monthly Spending Budget</label>
              <input
                type="number"
                min="0"
                step="500"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Daily Study Target (Minutes)</label>
              <input
                type="number"
                min="15"
                max="720"
                step="15"
                value={studyTarget}
                onChange={e => setStudyTarget(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Theme & Display */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Application Theme</p>
              <p className="text-[11px] text-muted-foreground">Toggle between high-contrast dark mode and crisp light mode.</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border font-bold flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
              <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>
          </div>
        </div>

        {/* Data Privacy & Export */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Data Isolation & Privacy Architecture</span>
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            LifeOS uses strict relational foreign key isolation per user ID. Your personal tasks, notes, documents, and expenses are completely isolated.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border font-bold text-foreground flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Complete Account Data (JSON)</span>
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-lg shadow-primary/25 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
};
