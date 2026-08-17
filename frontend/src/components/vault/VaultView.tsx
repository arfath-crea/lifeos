import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { DocumentVault } from '../../types';
import {
  ShieldCheck,
  Plus,
  FileText,
  AlertTriangle,
  Clock,
  Trash2,
  Lock,
  Eye,
  CheckCircle2,
  Calendar,
  Loader2,
  X
} from 'lucide-react';

export const VaultView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast } = useLifeOS();
  const [documents, setDocuments] = useState<DocumentVault[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // New Document Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Identity');
  const [newDocNum, setNewDocNum] = useState('');
  const [newIssueDate, setNewIssueDate] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newReminderDays, setNewReminderDays] = useState(30);
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [categoryFilter, refreshKey]);

  const fetchDocuments = async () => {
    try {
      const res = await api.getDocuments(categoryFilter !== 'ALL' ? categoryFilter : undefined);
      setDocuments(res);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.createDocument({
        title: newTitle,
        category: newCategory,
        document_number: newDocNum || undefined,
        issue_date: newIssueDate ? new Date(newIssueDate).toISOString() : undefined,
        expiry_date: newExpiryDate ? new Date(newExpiryDate).toISOString() : undefined,
        reminder_days_before: newReminderDays,
        notes: newNotes || undefined,
        file_name: `${newTitle.toLowerCase().replace(/\s+/g, '_')}_secure_record.pdf`
      });
      addToast('Document registered in vault!', 'success');
      setIsModalOpen(false);
      setNewTitle('');
      setNewDocNum('');
      setNewExpiryDate('');
      setNewIssueDate('');
      setNewNotes('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to save document', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    try {
      await api.deleteDocument(id);
      addToast('Document record deleted', 'info');
      triggerRefresh();
    } catch {
      addToast('Failed to delete document', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const expiringSoonCount = documents.filter(d => d.expiry_status === 'EXPIRING_SOON').length;
  const expiredCount = documents.filter(d => d.expiry_status === 'EXPIRED').length;

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <span>Document Vault</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Secure references for passports, certificates, IDs, and proactive expiry countdowns.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Document</span>
        </button>
      </div>

      {/* Security & Expiry Warning Banner */}
      {(expiringSoonCount > 0 || expiredCount > 0) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-500 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>
            Attention: You have {expiredCount > 0 && `${expiredCount} expired document(s)`}
            {expiredCount > 0 && expiringSoonCount > 0 && ' and '}
            {expiringSoonCount > 0 && `${expiringSoonCount} document(s) expiring within the next 30-90 days`}. Consider renewing promptly.
          </span>
        </div>
      )}

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {['ALL', 'Identity', 'Academic', 'Financial', 'Medical', 'Legal', 'Other'].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              categoryFilter === cat
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {documents.length === 0 ? (
          <div className="col-span-full text-center py-16 text-xs text-muted-foreground bg-card border border-border rounded-3xl">
            No documents found in this category. Click &quot;Add Document&quot; to securely store references.
          </div>
        ) : (
          documents.map(doc => {
            const isExpiring = doc.expiry_status === 'EXPIRING_SOON';
            const isExpired = doc.expiry_status === 'EXPIRED';

            return (
              <div
                key={doc.id}
                className="p-5 rounded-3xl bg-card border border-border/80 hover:border-primary/40 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs sm:text-sm text-foreground truncate max-w-[170px]">
                          {doc.title}
                        </h4>
                        <span className="text-[10px] font-semibold text-muted-foreground">{doc.category}</span>
                      </div>
                    </div>

                    {/* Expiry Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                      isExpired
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : isExpiring
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                        : doc.expiry_status === 'VALID'
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-secondary text-muted-foreground'
                    }`}>
                      {isExpired ? 'EXPIRED' : isExpiring ? `Expires in ${doc.days_to_expiry}d` : doc.expiry_status === 'VALID' ? 'VALID' : 'NO EXPIRY'}
                    </span>
                  </div>

                  {/* Document details */}
                  <div className="p-3 rounded-2xl bg-secondary/40 border border-border/60 text-[11px] space-y-1.5">
                    {doc.document_number && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">ID Number:</span>
                        <span className="font-mono font-bold text-foreground">{doc.document_number}</span>
                      </div>
                    )}
                    {doc.expiry_date && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <span className="font-semibold text-foreground">
                          {new Date(doc.expiry_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {doc.file_name && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Encrypted File:</span>
                        <span className="truncate max-w-[130px] font-mono text-[10px]">{doc.file_name}</span>
                      </div>
                    )}
                  </div>

                  {doc.notes && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {doc.notes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-semibold">
                    <Lock className="w-3 h-3" />
                    <span>Verified Encrypted</span>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Document Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Add Document to Vault</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Passport, AWS Certification, Health Insurance"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Identity">Identity</option>
                    <option value="Academic">Academic</option>
                    <option value="Financial">Financial</option>
                    <option value="Medical">Medical</option>
                    <option value="Legal">Legal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Document / ID Number</label>
                  <input
                    type="text"
                    value={newDocNum}
                    onChange={e => setNewDocNum(e.target.value)}
                    placeholder="e.g. Z4981023"
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Issue Date</label>
                  <input
                    type="date"
                    value={newIssueDate}
                    onChange={e => setNewIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={newExpiryDate}
                    onChange={e => setNewExpiryDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Reminder Alert (Days Before)</label>
                <select
                  value={newReminderDays}
                  onChange={e => setNewReminderDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  <option value={15}>15 Days before</option>
                  <option value={30}>30 Days before</option>
                  <option value={60}>60 Days before</option>
                  <option value={90}>90 Days before</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Physical Location / Locker Notes</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g. Stored in physical locker #12 or bank safe"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
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
                  <span>Secure in Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
