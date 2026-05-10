import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  FileText,
  MoreVertical, 
  Maximize2, 
  Minimize2,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List as ListIcon,
  ListOrdered,
  Quote,
  Code,
  Tag,
  Calendar,
  Clock,
  ChevronDown,
  Image as ImageIcon,
  Table as TableIcon,
  Columns,
  SquareCode
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';

const lowlight = createLowlight(common);
import { GlobalNote } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { format } from 'date-fns';

interface NotesViewProps {
  notes: GlobalNote[];
  setNotes: React.Dispatch<React.SetStateAction<GlobalNote[]>>;
}

const CATEGORIES = ['Brainstorming', 'Meeting', 'Personal', 'Strategy', 'Other'] as const;

export default function NotesView({ notes, setNotes }: NotesViewProps) {
  const [activeNoteId, setActiveNoteId] = useState<string | null>(notes[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(event.target as Node)) {
        setShowTableMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeNote = notes.find(n => n.id === activeNoteId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default code block to use lowlight
      }),
      Placeholder.configure({
        placeholder: 'Start brainstorming, taking meeting notes, or journaling here...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-2xl border border-slate-100 max-w-full h-auto my-6',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: activeNote?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full text-slate-600',
      },
    },
    onUpdate: ({ editor }) => {
      if (activeNoteId) {
        setNotes(prev => prev.map(n => 
          n.id === activeNoteId 
            ? { ...n, content: editor.getHTML(), updatedAt: new Date() } 
            : n
        ));
      }
    },
  }, [activeNoteId]);

  // Sync editor content when switching notes
  useEffect(() => {
    if (editor && activeNote && editor.getHTML() !== activeNote.content) {
      editor.commands.setContent(activeNote.content);
    }
  }, [activeNoteId, editor]);

  const filteredNotes = useMemo(() => {
    return notes
      .filter(n => {
        const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             n.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || n.category === activeCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, searchQuery, activeCategory]);

  const addNote = () => {
    const newNote: GlobalNote = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Note',
      content: '', // Start with empty content
      category: activeCategory !== 'All' ? (activeCategory as any) : 'Brainstorming',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    if (activeNoteId === id) {
      setActiveNoteId(updatedNotes[0]?.id || null);
    }
  };

  const updateNote = (id: string, updates: Partial<GlobalNote>) => {
    setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n));
  };

  const stats = useMemo(() => {
    if (!activeNote) return { words: 0, characters: 0 };
    // Get plain text from HTML content for stats
    const div = document.createElement('div');
    div.innerHTML = activeNote.content || '';
    const text = div.textContent || div.innerText || '';
    return {
      words: text.trim() ? text.trim().split(/\s+/).length : 0,
      characters: text.length
    };
  }, [activeNote]);

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleHeading1 = () => editor?.chain().focus().toggleHeading({ level: 1 }).run();
  const toggleHeading2 = () => editor?.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const toggleCodeBlock = () => editor?.chain().focus().toggleCodeBlock().run();

  const addImage = () => {
    const url = window.prompt('Enter image URL');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        editor?.chain().focus().setImage({ src: result }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-50 overflow-hidden font-sans">
      {/* Search & List Sidebar */}
      <div className={cn(
        "w-80 border-r border-slate-200 bg-white flex flex-col transition-all duration-500",
        isFullScreen ? "w-0 overflow-hidden border-none opacity-0" : "relative"
      )}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">Journal</h2>
            <button 
              onClick={addNote}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 rounded-xl pl-10 pr-4 py-2.5 text-sm transition-all"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
            {['All', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeCategory === cat 
                    ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                    : "text-slate-400 hover:bg-slate-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
          {filteredNotes.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <FileText size={32} className="mx-auto mb-4 text-slate-200" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No notes found</p>
            </div>
          ) : (
            filteredNotes.map(note => {
              // Extract text from HTML for snippet
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = note.content || '';
              const snippetText = tempDiv.textContent || tempDiv.innerText || '';

              return (
                <div 
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  className={cn(
                    "px-6 py-4 cursor-pointer border-b border-slate-50 relative group transition-all",
                    activeNoteId === note.id 
                      ? "bg-indigo-50/30 border-l-4 border-l-indigo-500" 
                      : "hover:bg-slate-50 border-l-4 border-l-transparent"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={cn(
                      "font-bold text-sm truncate pr-6",
                      activeNoteId === note.id ? "text-indigo-900" : "text-slate-700"
                    )}>
                      {note.title || 'Untitled Note'}
                    </h3>
                    <button 
                      onClick={(e) => deleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-rose-500 transition-all absolute right-4 top-4"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                    {snippetText || 'No content...'}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {format(new Date(note.updatedAt), 'MMM d')}
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                      note.category === 'Brainstorming' ? "bg-purple-100 text-purple-600" :
                      note.category === 'Meeting' ? "bg-emerald-100 text-emerald-600" :
                      note.category === 'Personal' ? "bg-amber-100 text-amber-600" :
                      note.category === 'Strategy' ? "bg-indigo-100 text-indigo-600" :
                      "bg-slate-100 text-slate-600"
                    )}>
                      {note.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-white transition-all duration-700 relative",
        isFullScreen ? "bg-white" : ""
      )}>
        {activeNote ? (
          <div className={cn(
            "flex-1 flex flex-col h-full",
            isFullScreen ? "max-w-4xl mx-auto w-full pt-16" : ""
          )}>
            {/* Header & Meta */}
            <div className={cn(
              "px-10 py-6 border-b border-slate-50 flex items-center justify-between",
              isFullScreen && "border-none px-0 pt-0"
            )}>
              <div className="flex-1 max-w-2xl">
                <input 
                  type="text"
                  value={activeNote.title}
                  onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                  className="w-full text-2xl font-black text-slate-900 border-none focus:ring-0 p-0 placeholder:text-slate-200"
                  placeholder="Note Title"
                />
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} className="text-slate-400" />
                    <select
                      value={activeNote.category}
                      onChange={e => updateNote(activeNote.id, { category: e.target.value as any })}
                      className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:text-indigo-600"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Clock size={12} />
                    <span>Last updated {format(new Date(activeNote.updatedAt), 'p')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="p-2 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl hover:bg-slate-100 transition-all"
                  title={isFullScreen ? "Minimize" : "Maximize"}
                >
                  {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
              </div>
            </div>

            {/* Toolbar */}
            <div className={cn(
              "px-10 py-3 border-b border-slate-50 flex items-center gap-1 bg-slate-50/50",
              isFullScreen && "px-0 bg-transparent border-slate-100"
            )}>
              <button 
                onClick={toggleHeading1} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('heading', { level: 1 }) ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Heading 1"
              >
                <Heading1 size={16} />
              </button>
              <button 
                onClick={toggleHeading2} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('heading', { level: 2 }) ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Heading 2"
              >
                <Heading2 size={16} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button 
                onClick={toggleBold} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('bold') ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Bold"
              >
                <Bold size={16} />
              </button>
              <button 
                onClick={toggleItalic} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('italic') ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Italic"
              >
                <Italic size={16} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button 
                onClick={toggleBulletList} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('bulletList') ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Bullet List"
              >
                <ListIcon size={16} />
              </button>
              <button 
                onClick={toggleOrderedList} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('orderedList') ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Ordered List"
              >
                <ListOrdered size={16} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              <button 
                onClick={toggleBlockquote} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('blockquote') ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Blockquote"
              >
                <Quote size={16} />
              </button>
              <button 
                onClick={toggleCodeBlock} 
                className={cn(
                  "p-2 rounded-lg transition-all",
                  editor?.isActive('codeBlock') ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                )}
                title="Code Block"
              >
                <Code size={16} />
              </button>
              <div className="w-px h-4 bg-slate-200 mx-1" />
              
              <div className="relative group">
                <input
                  type="file"
                  id="image-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                <button 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="p-2 rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 transition-all"
                  title="Upload Image"
                >
                  <ImageIcon size={16} />
                </button>
              </div>

              <div className="relative" ref={tableMenuRef}>
                <button 
                  onClick={() => setShowTableMenu(!showTableMenu)}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    editor?.isActive('table') ? "bg-white shadow-sm text-indigo-600" : "text-slate-400 hover:bg-white hover:text-indigo-600"
                  )}
                  title="Table"
                >
                  <TableIcon size={16} />
                </button>
                
                {showTableMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-slate-100 rounded-xl shadow-xl z-50 p-2 min-w-[200px] flex flex-col gap-1">
                    <button 
                      onClick={() => {
                        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                        setShowTableMenu(false);
                      }}
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all text-left flex items-center justify-between"
                    >
                      Insert 3x3 Table
                      <Plus size={12} />
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button 
                      disabled={!editor?.isActive('table')}
                      onClick={() => editor?.chain().focus().addColumnBefore().run()}
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 rounded-lg transition-all text-left"
                    >
                      Add Column before
                    </button>
                    <button 
                      disabled={!editor?.isActive('table')}
                      onClick={() => editor?.chain().focus().addColumnAfter().run()}
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 rounded-lg transition-all text-left"
                    >
                      Add Column after
                    </button>
                    <button 
                      disabled={!editor?.isActive('table')}
                      onClick={() => editor?.chain().focus().addRowBefore().run()}
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 rounded-lg transition-all text-left"
                    >
                      Add Row before
                    </button>
                    <button 
                      disabled={!editor?.isActive('table')}
                      onClick={() => editor?.chain().focus().addRowAfter().run()}
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 rounded-lg transition-all text-left"
                    >
                      Add Row after
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    <button 
                      disabled={!editor?.isActive('table')}
                      onClick={() => {
                        editor?.chain().focus().deleteTable().run();
                        setShowTableMenu(false);
                      }}
                      className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 disabled:opacity-30 rounded-lg transition-all text-left"
                    >
                      Delete Table
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={cn(
              "flex-1 overflow-y-auto no-scrollbar px-10 py-8",
              isFullScreen && "px-0"
            )}>
              <EditorContent editor={editor} />
            </div>

            {/* Footer Stats */}
            <div className={cn(
              "px-10 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30",
              isFullScreen && "px-0 bg-transparent border-slate-100"
            )}>
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Words</span>
                  <span className="text-sm font-bold text-slate-600">{stats.words}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Characters</span>
                  <span className="text-sm font-bold text-slate-600">{stats.characters}</span>
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Created {format(new Date(activeNote.createdAt), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
            <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mb-8 text-slate-200">
              <FileText size={48} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Select a note to read</h3>
            <p className="text-slate-400 mt-2 max-w-xs">Choose from your list of brainstorming and meeting notes or create a new one to get started.</p>
            <button 
              onClick={addNote}
              className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center gap-2"
            >
              <Plus size={18} />
              Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
