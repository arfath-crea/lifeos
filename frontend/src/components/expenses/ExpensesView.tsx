import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { Expense, ExpenseSummary } from '../../types';
import {
  Wallet,
  Plus,
  TrendingDown,
  TrendingUp,
  CreditCard,
  PieChart,
  Trash2,
  Calendar,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { user } = useAuth();
  const { refreshKey, triggerRefresh, addToast } = useLifeOS();
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [newCategory, setNewCategory] = useState('Food');
  const [newPaymentMethod, setNewPaymentMethod] = useState('UPI');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, [refreshKey]);

  const fetchExpenses = async () => {
    try {
      const [sumRes, expRes] = await Promise.all([
        api.getExpenseSummary(),
        api.getExpenses()
      ]);
      setSummary(sumRes);
      setExpenses(expRes);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.createExpense({
        title: newTitle,
        amount: parseFloat(newAmount),
        transaction_type: newType,
        category: newCategory,
        payment_method: newPaymentMethod,
        date: new Date(newDate).toISOString(),
        notes: newNotes || undefined
      });
      addToast(
        newType === 'EXPENSE' ? `Logged expense of ${user?.currency}${newAmount}` : `Recorded income of ${user?.currency}${newAmount}`,
        'success'
      );
      setIsModalOpen(false);
      setNewTitle('');
      setNewAmount('');
      setNewNotes('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to log transaction', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      addToast('Transaction removed', 'info');
      triggerRefresh();
    } catch {
      addToast('Failed to delete transaction', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const currency = user?.currency || '₹';

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Wallet className="w-7 h-7 text-primary" />
            <span>Personal Expense Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Track daily expenses, monitor category distribution, and keep your budget healthy.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Summary Cards Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Expense */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Monthly Expense</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-rose-500">
            {currency}{summary?.total_expense?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-muted-foreground font-medium">
            Monthly Budget: {currency}{summary?.monthly_budget?.toLocaleString()}
          </p>
        </div>

        {/* Total Income */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Income</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-500">
            {currency}{summary?.total_income?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
          <p className="text-[11px] text-muted-foreground font-medium">
            Inflow logged this period
          </p>
        </div>

        {/* Net Savings & Budget Used */}
        <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Budget Utilization</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              (summary?.budget_used_percentage || 0) > 85 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {summary?.budget_used_percentage || 0}%
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-secondary overflow-hidden my-2">
            <div
              className={`h-full transition-all duration-500 ${
                (summary?.budget_used_percentage || 0) > 85
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, summary?.budget_used_percentage || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground font-medium">
            Net Cash Flow: <span className="font-bold text-foreground">{currency}{summary?.net_savings?.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* Grid: Category Breakdown + Transactions History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
              Spending by Category
            </h3>
            <PieChart className="w-4 h-4 text-primary" />
          </div>

          <div className="space-y-3">
            {(!summary?.categories || summary.categories.length === 0) ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                No expense categories logged yet.
              </div>
            ) : (
              summary.categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{currency}{cat.amount.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">({cat.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Transaction History (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">
              Transaction History
            </h3>
            <span className="text-xs text-muted-foreground">{expenses.length} records</span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {expenses.length === 0 ? (
              <div className="text-center py-10 text-xs text-muted-foreground">
                No transactions recorded. Click &quot;Add Transaction&quot; or use natural language (e.g. &quot;Spent ₹250 on lunch&quot;).
              </div>
            ) : (
              expenses.map(exp => {
                const isExpense = exp.transaction_type === 'EXPENSE';
                return (
                  <div
                    key={exp.id}
                    className="p-3.5 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-border/70 flex items-center justify-between gap-3 text-xs transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                        isExpense ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'
                      }`}>
                        {isExpense ? '↓' : '↑'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{exp.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 rounded bg-secondary text-muted-foreground font-semibold">{exp.category}</span>
                          <span>•</span>
                          <span>{exp.payment_method}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-extrabold text-sm ${isExpense ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {isExpense ? '-' : '+'}{currency}{exp.amount.toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Record New Transaction</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-secondary/80 border border-border">
                <button
                  type="button"
                  onClick={() => setNewType('EXPENSE')}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    newType === 'EXPENSE' ? 'bg-card text-rose-500 shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setNewType('INCOME')}
                  className={`py-2 rounded-xl font-bold transition-all ${
                    newType === 'INCOME' ? 'bg-card text-emerald-500 shadow-xs' : 'text-muted-foreground'
                  }`}
                >
                  Income
                </button>
              </div>

              <div>
                <label className="block font-semibold mb-1">Title / Description *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Groceries, Metro Card recharge, Swiggy dinner"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Amount ({currency}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Rent">Rent</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Health">Health</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Payment Method</label>
                  <select
                    value={newPaymentMethod}
                    onChange={e => setNewPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-secondary font-semibold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save Transaction</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
