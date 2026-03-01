
import React, { useState, useEffect } from 'react';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { crmStore } from '../services/crmService';
import {
  Users, Plus, X, Search, Phone, Mail, Star, TrendingUp,
  Euro, MapPin, Tag, Loader2, UserCheck, Building2, Home,
  Briefcase, Filter, ChevronRight, Edit3, Trash2, CalendarDays
} from 'lucide-react';

const STATUS_CONFIG: Record<CustomerStatus, { label: string; color: string; bg: string }> = {
  [CustomerStatus.ACTIVE]:   { label: 'Aktiv',    color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  [CustomerStatus.VIP]:      { label: 'VIP',      color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
  [CustomerStatus.INACTIVE]: { label: 'Inaktiv',  color: 'text-slate-500',   bg: 'bg-slate-800/50 border-slate-700' },
  [CustomerStatus.CLOSED]:   { label: 'Avsluttet',color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10 border-fuchsia-500/20' },
};

const TYPE_CONFIG: Record<CustomerType, { label: string; icon: React.ReactNode }> = {
  [CustomerType.BUYER]:    { label: 'Kjøper',     icon: <Home size={14} /> },
  [CustomerType.SELLER]:   { label: 'Selger',     icon: <Building2 size={14} /> },
  [CustomerType.INVESTOR]: { label: 'Investor',   icon: <TrendingUp size={14} /> },
  [CustomerType.RENTER]:   { label: 'Leietaker',  icon: <Briefcase size={14} /> },
};

const EMPTY_FORM = {
  name: '', email: '', phone: '', nationality: '', source: '',
  status: CustomerStatus.ACTIVE, type: CustomerType.BUYER,
  notes: '', budget: '', location: '', tags: '',
};

const CRM: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(crmStore.getCustomers());
  const [selected, setSelected] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | CustomerStatus>('all');
  const [filterType, setFilterType] = useState<'all' | CustomerType>('all');
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    return crmStore.subscribe(() => setCustomers(crmStore.getCustomers()));
  }, []);

  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchType   = filterType === 'all'   || c.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total:    customers.length,
    active:   customers.filter(c => c.status === CustomerStatus.ACTIVE).length,
    vip:      customers.filter(c => c.status === CustomerStatus.VIP).length,
    totalVal: customers.reduce((s, c) => s + (c.totalValue || 0), 0),
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const customer: Customer = {
      id: `crm-${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      nationality: form.nationality || undefined,
      source: form.source || undefined,
      status: form.status,
      type: form.type,
      notes: form.notes || undefined,
      budget: form.budget ? parseInt(form.budget) : undefined,
      location: form.location || undefined,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      createdAt: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      propertiesInterested: [],
      propertiesBought: [],
    };
    crmStore.addCustomer(customer);
    setIsFormOpen(false);
    setForm(EMPTY_FORM);
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleDelete = (id: string) => {
    if (confirm('Slett denne kunden?')) {
      crmStore.removeCustomer(id);
      if (selected?.id === id) setSelected(null);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold neon-text text-cyan-400">Kundekort</h1>
          <p className="text-slate-400 text-xs mt-1">{stats.total} kunder · {stats.vip} VIP · €{(stats.totalVal / 1000000).toFixed(1)}M portefølje</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
        >
          <Plus size={16} /> Ny Kunde
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Totalt', value: stats.total, icon: <Users size={18} className="text-cyan-400" /> },
          { label: 'Aktive', value: stats.active, icon: <UserCheck size={18} className="text-emerald-400" /> },
          { label: 'VIP', value: stats.vip, icon: <Star size={18} className="text-amber-400" /> },
          { label: 'Portefølje', value: `€${(stats.totalVal / 1000000).toFixed(1)}M`, icon: <Euro size={18} className="text-fuchsia-400" /> },
        ].map(s => (
          <div key={s.label} className="glass p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{s.label}</span></div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Søk på navn, e-post, sted..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Alle statuser</option>
          {Object.values(CustomerStatus).map(s => (
            <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          <option value="all">Alle typer</option>
          {Object.values(CustomerType).map(t => (
            <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
          ))}
        </select>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(customer => {
          const statusCfg = STATUS_CONFIG[customer.status];
          const typeCfg   = TYPE_CONFIG[customer.type];
          return (
            <div
              key={customer.id}
              onClick={() => setSelected(customer)}
              className="glass p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 cursor-pointer group transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {customer.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 group-hover:text-cyan-400 transition-colors text-sm">{customer.name}</h3>
                    <p className="text-[10px] text-slate-500">{customer.nationality || 'Ukjent nasjonalitet'}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>
                  {statusCfg.label}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Mail size={11} className="text-slate-600" />
                  <span className="truncate">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <Phone size={11} className="text-slate-600" />
                  <span>{customer.phone}</span>
                </div>
                {customer.location && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <MapPin size={11} className="text-slate-600" />
                    <span>{customer.location}</span>
                  </div>
                )}
                {customer.budget && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Euro size={11} className="text-slate-600" />
                    <span>Budsjett: €{customer.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded-lg">
                  {typeCfg.icon} {typeCfg.label}
                </span>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-3 text-center py-20 opacity-30">
            <Users size={48} className="mx-auto mb-4" />
            <p className="text-xs font-mono uppercase">Ingen kunder funnet</p>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex justify-end animate-in slide-in-from-right duration-300">
          <div className="w-full lg:w-[600px] bg-[#0a0a0c] border-l border-slate-800 h-full flex flex-col shadow-2xl">
            <header className="p-6 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  {selected.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name}</h2>
                  <p className="text-xs text-slate-500">{TYPE_CONFIG[selected.type].label} · {STATUS_CONFIG[selected.status].label}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(selected.id)} className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-xl transition-colors">
                  <Trash2 size={18} />
                </button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-400">
                  <X size={20} />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
              {/* Contact info */}
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kontaktinfo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-600 mb-1">E-post</p>
                    <a href={`mailto:${selected.email}`} className="text-sm text-cyan-400 hover:underline">{selected.email}</a>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 mb-1">Telefon</p>
                    <a href={`tel:${selected.phone}`} className="text-sm text-slate-200">{selected.phone}</a>
                  </div>
                  {selected.nationality && (
                    <div>
                      <p className="text-[10px] text-slate-600 mb-1">Nasjonalitet</p>
                      <p className="text-sm text-slate-200">{selected.nationality}</p>
                    </div>
                  )}
                  {selected.source && (
                    <div>
                      <p className="text-[10px] text-slate-600 mb-1">Kilde</p>
                      <p className="text-sm text-slate-200">{selected.source}</p>
                    </div>
                  )}
                  {selected.location && (
                    <div>
                      <p className="text-[10px] text-slate-600 mb-1">Område</p>
                      <p className="text-sm text-slate-200">{selected.location}</p>
                    </div>
                  )}
                  {selected.budget && (
                    <div>
                      <p className="text-[10px] text-slate-600 mb-1">Budsjett</p>
                      <p className="text-sm text-emerald-400 font-bold">€{selected.budget.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selected.notes && (
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Notater</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{selected.notes}</p>
                </div>
              )}

              {/* Tags */}
              {selected.tags && selected.tags.length > 0 && (
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-2 gap-3">
                <a href={`mailto:${selected.email}`} className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-all">
                  <Mail size={15} /> Send E-post
                </a>
                <a href={`tel:${selected.phone}`} className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-all">
                  <Phone size={15} /> Ring
                </a>
              </div>

              {/* Dates */}
              <div className="flex gap-4 text-[10px] text-slate-600">
                <span>Opprettet: {new Date(selected.createdAt).toLocaleDateString('nb-NO')}</span>
                <span>Sist kontakt: {new Date(selected.lastContact).toLocaleDateString('nb-NO')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <header className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="text-cyan-400" size={20} /> Ny Kunde
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </header>
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Fullt navn" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="E-post" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Telefon" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Nasjonalitet" value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Kilde (Nettside, Messe...)" value={form.source} onChange={e => setForm({...form, source: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <select value={form.status} onChange={e => setForm({...form, status: e.target.value as CustomerStatus})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                  {Object.values(CustomerStatus).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                </select>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value as CustomerType})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500">
                  {Object.values(CustomerType).map(t => <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>)}
                </select>
                <input placeholder="Budsjett (EUR)" type="number" value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Ønsket sted / område" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <input placeholder="Tags (komma-separert)" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
                <textarea placeholder="Notater om kunden..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[80px]" />
              </div>
              <button type="submit" disabled={isSaving} className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all">
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                Lagre Kunde
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;
