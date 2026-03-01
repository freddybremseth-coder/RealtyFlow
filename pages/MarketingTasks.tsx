
import React, { useState, useEffect } from 'react';
import { MarketingTask, MarketingTaskStatus } from '../types';
import { marketingTaskStore } from '../services/marketingTaskService';
import {
  Megaphone, Plus, X, Instagram, Twitter, Linkedin, Mail,
  Facebook, Video, Globe, Flag, Loader2, GripVertical,
  ChevronRight, Clock, Tag, Trash2
} from 'lucide-react';

const COLUMNS: { id: MarketingTaskStatus; label: string; color: string; dot: string }[] = [
  { id: MarketingTaskStatus.PENDING,     label: 'Å gjøre',       color: 'text-slate-400',   dot: 'bg-slate-500' },
  { id: MarketingTaskStatus.IN_PROGRESS, label: 'Pågår',         color: 'text-amber-400',   dot: 'bg-amber-500' },
  { id: MarketingTaskStatus.REVIEW,      label: 'Til gjennomgang', color: 'text-indigo-400', dot: 'bg-indigo-500' },
  { id: MarketingTaskStatus.DONE,        label: 'Ferdig',         color: 'text-emerald-400', dot: 'bg-emerald-500' },
];

const PLATFORM_CONFIG: Record<string, { color: string; bg: string }> = {
  'Instagram': { color: 'text-pink-400',    bg: 'bg-pink-500/10 border-pink-500/20' },
  'Facebook':  { color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
  'LinkedIn':  { color: 'text-sky-400',     bg: 'bg-sky-500/10 border-sky-500/20' },
  'TikTok':    { color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
  'E-post':    { color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  'YouTube':   { color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
  'Nettside':  { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
};

const PRIORITY_CONFIG = {
  'HIGH':   { label: 'Høy',   color: 'text-red-400',    dot: 'bg-red-500' },
  'MEDIUM': { label: 'Middels', color: 'text-amber-400', dot: 'bg-amber-500' },
  'LOW':    { label: 'Lav',   color: 'text-slate-500',  dot: 'bg-slate-600' },
};

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'E-post', 'YouTube', 'Nettside'];

const EMPTY_FORM = {
  title: '',
  content: '',
  platform: 'Instagram',
  priority: 'MEDIUM' as const,
  dueDate: '',
  tags: '',
};

const MarketingTasks: React.FC = () => {
  const [tasks, setTasks] = useState<MarketingTask[]>(marketingTaskStore.getTasks());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selected, setSelected] = useState<MarketingTask | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<MarketingTaskStatus | null>(null);

  useEffect(() => {
    return marketingTaskStore.subscribe(() => setTasks(marketingTaskStore.getTasks()));
  }, []);

  const filtered = filterPlatform === 'all' ? tasks : tasks.filter(t => t.platform === filterPlatform);
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === MarketingTaskStatus.DONE).length;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const task: MarketingTask = {
      id: `mt-${Date.now()}`,
      title: form.title,
      content: form.content || undefined,
      platform: form.platform || undefined,
      status: MarketingTaskStatus.PENDING,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      createdAt: new Date().toISOString(),
    };
    marketingTaskStore.addTask(task);
    setIsFormOpen(false);
    setForm(EMPTY_FORM);
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleDelete = (id: string) => {
    if (confirm('Slett denne oppgaven?')) {
      marketingTaskStore.removeTask(id);
      if (selected?.id === id) setSelected(null);
    }
  };

  const handleMoveTask = (id: string, status: MarketingTaskStatus) => {
    marketingTaskStore.updateTaskStatus(id, status);
    if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null);
  };

  // Drag & Drop
  const onDragStart = (id: string) => setDraggedId(id);
  const onDragOver = (e: React.DragEvent, colId: MarketingTaskStatus) => {
    e.preventDefault();
    setDragOverCol(colId);
  };
  const onDrop = (colId: MarketingTaskStatus) => {
    if (draggedId) handleMoveTask(draggedId, colId);
    setDraggedId(null);
    setDragOverCol(null);
  };

  const getPlatformStyle = (platform?: string) =>
    platform && PLATFORM_CONFIG[platform] ? PLATFORM_CONFIG[platform] : { color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold neon-text text-cyan-400">Markedsoppgaver</h1>
          <p className="text-slate-400 text-xs mt-1">{done}/{total} oppgaver fullført</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Alle plattformer</option>
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
          >
            <Plus size={16} /> Ny Oppgave
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="glass p-4 rounded-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total fremgang</span>
          <span className="text-xs font-bold text-white">{total > 0 ? Math.round((done / total) * 100) : 0}%</span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x no-scrollbar">
        {COLUMNS.map(col => {
          const colTasks = filtered.filter(t => t.status === col.id);
          const isDragOver = dragOverCol === col.id;
          return (
            <div
              key={col.id}
              className="w-72 flex-shrink-0 flex flex-col gap-3 snap-start"
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={() => onDrop(col.id)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <h3 className={`font-bold uppercase tracking-widest text-[10px] ${col.color}`}>{col.label}</h3>
                </div>
                <span className="text-[10px] text-slate-600 font-mono bg-slate-900 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>

              {/* Drop zone */}
              <div className={`flex-1 rounded-3xl border p-2 space-y-3 min-h-[300px] transition-all ${
                isDragOver
                  ? 'border-cyan-500/40 bg-cyan-500/5'
                  : 'border-slate-900/50 bg-slate-900/10'
              }`}>
                {colTasks.map(task => {
                  const pStyle = getPlatformStyle(task.platform);
                  const priCfg = PRIORITY_CONFIG[task.priority];
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => onDragStart(task.id)}
                      onClick={() => setSelected(task)}
                      className={`glass p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group transition-all ${
                        task.status === MarketingTaskStatus.DONE ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Platform badge */}
                      {task.platform && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border mb-2 ${pStyle.bg} ${pStyle.color}`}>
                          {task.platform}
                        </span>
                      )}

                      <h4 className={`font-bold text-sm text-slate-200 group-hover:text-cyan-400 transition-colors ${
                        task.status === MarketingTaskStatus.DONE ? 'line-through text-slate-500' : ''
                      }`}>
                        {task.title}
                      </h4>

                      {task.content && (
                        <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                          {task.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-3">
                        <span className={`flex items-center gap-1 text-[10px] ${priCfg.color}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${priCfg.dot}`} />
                          {priCfg.label}
                        </span>
                        {task.dueDate && (
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Clock size={9} />
                            {new Date(task.dueDate + 'T12:00:00').toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className={`text-center py-8 text-[10px] font-mono uppercase text-slate-700 transition-colors ${isDragOver ? 'text-cyan-700' : ''}`}>
                    {isDragOver ? 'Slipp her' : 'Ingen oppgaver'}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task detail panel */}
      {selected && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex justify-end animate-in slide-in-from-right duration-300">
          <div className="w-full lg:w-[500px] bg-[#0a0a0c] border-l border-slate-800 h-full flex flex-col shadow-2xl">
            <header className="p-6 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
              <div>
                {selected.platform && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${getPlatformStyle(selected.platform).color}`}>
                    {selected.platform}
                  </span>
                )}
                <h2 className="text-xl font-bold text-white mt-1">{selected.title}</h2>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(selected.id)} className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-xl transition-colors">
                  <Trash2 size={18} />
                </button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400"><X size={20} /></button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
              {selected.content && (
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Innhold / Beskrivelse</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{selected.content}</p>
                </div>
              )}

              {selected.tags && selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selected.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400">{tag}</span>
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Flytt til kolonne</h4>
                <div className="space-y-2">
                  {COLUMNS.map(col => (
                    <button
                      key={col.id}
                      onClick={() => handleMoveTask(selected.id, col.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-sm font-medium ${
                        selected.status === col.id
                          ? `${col.color} bg-slate-800 border-slate-600`
                          : 'text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {selected.dueDate && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock size={14} className="text-slate-600" />
                  Frist: {new Date(selected.dueDate + 'T12:00:00').toLocaleDateString('nb-NO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <header className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Megaphone className="text-cyan-400" size={20} /> Ny Markedsoppgave
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </header>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <input required placeholder="Tittel på oppgaven" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
              <div className="grid grid-cols-2 gap-4">
                <select value={form.platform} onChange={e => setForm({...form, platform: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                  {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                  <option value="HIGH">Høy prioritet</option>
                  <option value="MEDIUM">Middels prioritet</option>
                  <option value="LOW">Lav prioritet</option>
                </select>
              </div>
              <input type="date" placeholder="Fristdato" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
              <input placeholder="Tags (komma-separert)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
              <textarea placeholder="Beskrivelse / innholdsidé..." value={form.content} onChange={e => setForm({...form, content: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[100px]" />
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Lagre Oppgave
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingTasks;
