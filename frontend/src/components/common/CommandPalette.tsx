import React, { useState, useEffect, useRef } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import {
  Search,
  Sparkles,
  CheckSquare,
  FileText,
  Calendar,
  Wallet,
  ShieldCheck,
  Target,
  GraduationCap,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const { isCommandPaletteOpen, setIsCommandPaletteOpen, setActiveView, triggerRefresh, addToast, fireConfetti } = useLifeOS();
  const [query, setQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSearchResults(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search(query);
        setSearchResults(res);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const handleExecuteNaturalLanguage = async () => {
    if (!query.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      const res = await api.executeCommand(query, true);
      addToast(res.response_message, 'success');
      fireConfetti();
      triggerRefresh();
      setIsCommandPaletteOpen(false);
    } catch (err: any) {
      addToast(err.message || 'Failed to process command', 'error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    } else if (e.key === 'Enter' && query.trim()) {
      handleExecuteNaturalLanguage();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="p-4 border-b border-border flex items-center gap-3 bg-secondary/30">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command (e.g. 'Spent ₹250 on lunch', 'Remind me to study Java tomorrow') or search..."
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-secondary"
          >
            Esc
          </button>
        </div>

        {/* Dynamic Content Area */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {/* Quick AI Action Card if text entered */}
          {query.trim() && (
            <div
              onClick={handleExecuteNaturalLanguage}
              className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                  <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    Execute with LifeOS AI
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Parse and auto-create in database: &ldquo;<span className="text-foreground font-medium">{query}</span>&rdquo;
                  </p>
                </div>
              </div>
              <button
                disabled={isExecuting}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                {isExecuting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Execute</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Search Results */}
          {isSearching && (
            <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Searching across all modules...</span>
            </div>
          )}

          {searchResults && searchResults.total_results > 0 && (
            <div className="space-y-4">
              {/* Tasks */}
              {searchResults.results.tasks?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <CheckSquare className="w-3 h-3 text-blue-500" /> Tasks ({searchResults.results.tasks.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.results.tasks.map((t: any) => (
                      <div
                        key={t.id}
                        onClick={() => { setActiveView('tasks'); setIsCommandPaletteOpen(false); }}
                        className="p-2.5 rounded-xl hover:bg-secondary/80 flex items-center justify-between text-xs cursor-pointer border border-transparent hover:border-border"
                      >
                        <span className="font-medium text-foreground">{t.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {searchResults.results.notes?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-emerald-500" /> Notes ({searchResults.results.notes.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.results.notes.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => { setActiveView('notes'); setIsCommandPaletteOpen(false); }}
                        className="p-2.5 rounded-xl hover:bg-secondary/80 flex items-center justify-between text-xs cursor-pointer border border-transparent hover:border-border"
                      >
                        <div>
                          <p className="font-medium text-foreground">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{n.preview}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses */}
              {searchResults.results.expenses?.length > 0 && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
                    <Wallet className="w-3 h-3 text-amber-500" /> Expenses ({searchResults.results.expenses.length})
                  </p>
                  <div className="space-y-1">
                    {searchResults.results.expenses.map((e: any) => (
                      <div
                        key={e.id}
                        onClick={() => { setActiveView('expenses'); setIsCommandPaletteOpen(false); }}
                        className="p-2.5 rounded-xl hover:bg-secondary/80 flex items-center justify-between text-xs cursor-pointer border border-transparent hover:border-border"
                      >
                        <span className="font-medium text-foreground">{e.title}</span>
                        <span className="font-semibold text-rose-500">₹{e.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {searchResults && searchResults.total_results === 0 && !isSearching && (
            <div className="text-center py-6 text-xs text-muted-foreground">
              No matching records found. Press Enter to execute as an AI command!
            </div>
          )}

          {!query.trim() && (
            <div className="space-y-2 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Example Natural Language Commands
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  "Spent ₹350 on lunch at cafe",
                  "Remind me to renew passport on Sept 12",
                  "Submit Java assignment due Friday",
                  "Doctor appointment on Tuesday at 4pm",
                  "Note down: Docker compose simplifies multi-container deployments",
                  "I spent ₹1200 on textbooks"
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setQuery(sample)}
                    className="p-2.5 text-left rounded-xl bg-secondary/50 hover:bg-secondary border border-border/60 hover:border-primary/40 text-muted-foreground hover:text-foreground transition-all"
                  >
                    💡 {sample}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
