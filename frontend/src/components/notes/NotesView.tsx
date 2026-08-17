import React, { useState, useEffect } from 'react';
import { useLifeOS } from '../../context/LifeOSContext';
import { api } from '../../api/client';
import { Note, NoteFolder } from '../../types';
import {
  BookOpen,
  Folder,
  FolderPlus,
  Plus,
  Pin,
  Tag,
  Search,
  Trash2,
  Edit3,
  Eye,
  CheckSquare,
  Save,
  Loader2,
  X
} from 'lucide-react';

export const NotesView: React.FC = () => {
  const { refreshKey, triggerRefresh, addToast } = useLifeOS();
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editorTitle, setEditorTitle] = useState('');
  const [editorContent, setEditorContent] = useState('');
  const [editorTags, setEditorTags] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  // New folder modal
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedFolderId, searchQuery, refreshKey]);

  const fetchData = async () => {
    try {
      const [foldersRes, notesRes] = await Promise.all([
        api.getFolders(),
        api.getNotes({ folder_id: selectedFolderId || undefined, q: searchQuery || undefined })
      ]);
      setFolders(foldersRes);
      setNotes(notesRes);
      if (!selectedNote && notesRes.length > 0) {
        selectNote(notesRes[0]);
      } else if (selectedNote) {
        const stillExists = notesRes.find(n => n.id === selectedNote.id);
        if (stillExists) selectNote(stillExists);
      }
    } catch (err) {
      console.error('Failed to load notes data:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditorTitle(note.title);
    setEditorContent(note.content);
    setEditorTags(note.tags || '');
    setIsEditing(false);
  };

  const handleCreateNewNote = async () => {
    try {
      const newNote = await api.createNote({
        title: 'Untitled Note',
        content: '# New Note\n\nStart typing ideas, code snippets, or notes...',
        folder_id: selectedFolderId || (folders[0]?.id || undefined),
        tags: 'Draft'
      });
      addToast('Created new note', 'success');
      triggerRefresh();
      selectNote(newNote);
      setIsEditing(true);
    } catch (err: any) {
      addToast(err.message || 'Failed to create note', 'error');
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;
    try {
      const updated = await api.updateNote(selectedNote.id, {
        title: editorTitle,
        content: editorContent,
        tags: editorTags
      });
      setSelectedNote(updated);
      setIsEditing(false);
      addToast('Note saved!', 'success');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to save note', 'error');
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      await api.updateNote(note.id, { is_pinned: !note.is_pinned });
      triggerRefresh();
    } catch {
      addToast('Failed to update pin', 'error');
    }
  };

  const handleDeleteNote = async (id: number) => {
    try {
      await api.deleteNote(id);
      addToast('Note deleted', 'info');
      setSelectedNote(null);
      triggerRefresh();
    } catch {
      addToast('Failed to delete note', 'error');
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName.trim());
      addToast('Folder created!', 'success');
      setIsFolderModalOpen(false);
      setNewFolderName('');
      triggerRefresh();
    } catch (err: any) {
      addToast(err.message || 'Failed to create folder', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <BookOpen className="w-7 h-7 text-primary" />
            <span>Knowledge Vault & Notes</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Hierarchical knowledge base with markdown and full-text search.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
          <button
            onClick={handleCreateNewNote}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md shadow-primary/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Note</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Layout: Folders | Notes List | Editor/Preview */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 min-h-[550px]">
        {/* Left Pane: Folders (3 cols) */}
        <div className="md:col-span-3 bg-card border border-border rounded-3xl p-4 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Knowledge Folders
              </p>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedFolderId === null
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>All Notes</span>
                </div>
                <span className="text-[10px] font-bold opacity-75">{notes.length}</span>
              </button>

              {folders.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedFolderId === f.id
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 shrink-0" />
                    <span className="truncate">{f.name}</span>
                  </div>
                  <span className="text-[10px] font-bold opacity-75">{f.note_count || 0}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Pane: Notes List (4 cols) */}
        <div className="md:col-span-4 bg-card border border-border rounded-3xl p-4 flex flex-col shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search across notes..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
            {notes.length === 0 ? (
              <div className="text-center py-12 text-xs text-muted-foreground">
                No notes found.
              </div>
            ) : (
              notes.map(n => {
                const isSelected = selectedNote?.id === n.id;
                return (
                  <div
                    key={n.id}
                    onClick={() => selectNote(n)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-secondary border-primary/40 shadow-xs'
                        : 'bg-secondary/30 hover:bg-secondary/60 border-border/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-foreground truncate">{n.title}</h4>
                      {n.is_pinned && <Pin className="w-3 h-3 text-amber-500 shrink-0 fill-amber-500" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {n.content?.replace(/^[#\*\-`]/gm, '') || 'Empty note...'}
                    </p>
                    {n.tags && (
                      <div className="flex items-center gap-1 mt-2">
                        <Tag className="w-2.5 h-2.5 text-primary" />
                        <span className="text-[10px] text-primary font-medium truncate">{n.tags}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Markdown Editor & Reader (5 cols) */}
        <div className="md:col-span-5 bg-card border border-border rounded-3xl p-5 flex flex-col justify-between shadow-xs">
          {selectedNote ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTogglePin(selectedNote)}
                    className={`p-1.5 rounded-lg hover:bg-secondary transition-colors ${
                      selectedNote.is_pinned ? 'text-amber-500' : 'text-muted-foreground'
                    }`}
                    title="Pin Note"
                  >
                    <Pin className={`w-4 h-4 ${selectedNote.is_pinned ? 'fill-amber-500' : ''}`} />
                  </button>
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    Updated {new Date(selectedNote.updated_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsPreview(!isPreview)}
                    className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                      isPreview ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                    title="Toggle Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[11px]">{isPreview ? 'Edit' : 'Preview'}</span>
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="p-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1 shadow-xs"
                    title="Save Note"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Save</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Tags */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={e => { setEditorTitle(e.target.value); setIsEditing(true); }}
                  placeholder="Note Title"
                  className="w-full text-base font-extrabold text-foreground bg-transparent focus:outline-none placeholder:text-muted-foreground"
                />
                <input
                  type="text"
                  value={editorTags}
                  onChange={e => { setEditorTags(e.target.value); setIsEditing(true); }}
                  placeholder="Tags (comma separated)..."
                  className="w-full text-xs text-primary bg-transparent focus:outline-none placeholder:text-muted-foreground/60"
                />
              </div>

              {/* Body */}
              <div className="flex-1 min-h-[300px]">
                {isPreview ? (
                  <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border/70 text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans overflow-y-auto max-h-[350px]">
                    {editorContent}
                  </div>
                ) : (
                  <textarea
                    value={editorContent}
                    onChange={e => { setEditorContent(e.target.value); setIsEditing(true); }}
                    placeholder="Write your markdown note here..."
                    className="w-full h-full min-h-[320px] p-3.5 rounded-2xl bg-secondary/40 border border-border/70 text-xs text-foreground font-mono leading-relaxed focus:outline-none focus:border-primary resize-none"
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-xs text-muted-foreground">
              Select or create a note to begin reading and editing.
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {isFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl p-6 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">Create New Folder</h3>
              <button onClick={() => setIsFolderModalOpen(false)} className="p-1 rounded-lg hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFolder} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Folder Name *</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="e.g. Computer Science, Career, Personal"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFolderModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-secondary font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold"
                >
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
