
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LeadStatus, Lead, Property, ViewingItem, CallLog, NurtureStep, EmailMessage } from '@/types';
import { leadStore } from '@/services/leadService';
import { crmStore } from '@/services/crmService';
import { propertyStore } from '@/services/propertyService';
import { webhookService, WebhookLead } from '@/services/webhookService';
import { BRANDS } from '@/constants';
import { useNavigate } from 'react-router-dom';
import {
  X, Plus, Sparkles, Zap, BrainCircuit, Target, BarChart,
  ChevronRight, CheckCircle2, Phone, Mail, Loader2,
  RefreshCw, Copy, Check, FileText, Upload, File, MessageSquare, SendHorizontal, MapPin, Euro, BedDouble, Bath,
  Home, ImageIcon, Wand2, FileSearch, UserPlus, Save, Camera, Clock, Navigation, CalendarDays, User,
  CheckSquare, Square, ClipboardList, Trash2, AlertTriangle, PhoneCall, History, Play, Quote, UserCheck, TrendingUp, Filter, Download, Inbox, MessageCircle,
  Webhook, ChevronDown, Building2, ShoppingBag, WifiOff
} from 'lucide-react';
import { gemini } from '@/services/geminiService';

const COLUMNS = [
  { id: LeadStatus.NEW,         label: 'Ny',           color: 'bg-cyan-500'    },
  { id: LeadStatus.CONTACT,     label: 'Kontaktfase',  color: 'bg-blue-500'    },
  { id: LeadStatus.QUALIFIED,   label: 'Kvalifisert',  color: 'bg-indigo-500'  },
  { id: LeadStatus.VIEWING,     label: 'Visning',      color: 'bg-emerald-500' },
  { id: LeadStatus.NEGOTIATION, label: 'Forhandling',  color: 'bg-amber-500'   },
  { id: LeadStatus.WON,         label: 'Kunde',        color: 'bg-fuchsia-500' },
  { id: LeadStatus.ON_HOLD,     label: 'På vent',      color: 'bg-slate-500'   },
];

const STATUS_ACTIONS: { status: LeadStatus; label: string; color: string; bg: string }[] = [
  { status: LeadStatus.NEW,         label: 'Ny',          color: 'text-cyan-400',    bg: 'border-cyan-500/30 hover:bg-cyan-500/10'    },
  { status: LeadStatus.CONTACT,     label: 'Kontaktfase', color: 'text-blue-400',    bg: 'border-blue-500/30 hover:bg-blue-500/10'    },
  { status: LeadStatus.QUALIFIED,   label: 'Kvalifisert', color: 'text-indigo-400',  bg: 'border-indigo-500/30 hover:bg-indigo-500/10'},
  { status: LeadStatus.VIEWING,     label: 'Visning',     color: 'text-emerald-400', bg: 'border-emerald-500/30 hover:bg-emerald-500/10'},
  { status: LeadStatus.NEGOTIATION, label: 'Forhandling', color: 'text-amber-400',   bg: 'border-amber-500/30 hover:bg-amber-500/10'  },
  { status: LeadStatus.WON,         label: 'Kunde',       color: 'text-fuchsia-400', bg: 'border-fuchsia-500/30 hover:bg-fuchsia-500/10'},
  { status: LeadStatus.ON_HOLD,     label: 'På vent',     color: 'text-slate-400',   bg: 'border-slate-500/30 hover:bg-slate-500/10'  },
  { status: LeadStatus.LOST,        label: 'Tapt',        color: 'text-red-400',     bg: 'border-red-500/30 hover:bg-red-500/10'      },
];

const Pipeline: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [convertedLeadIds, setConvertedLeadIds] = useState<Set<string>>(
    new Set(crmStore.getCustomers().filter(c => c.leadId).map(c => c.leadId!))
  );
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'info' | 'emails' | 'strategy'>('info');
  const [emailAnalysis, setEmailAnalysis] = useState<any>(null);
  const [isAnalyzingEmails, setIsAnalyzingEmails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  const [newLead, setNewLead] = useState({
    name: '', email: '', value: '', notes: '',
    bedrooms: '', location: '', propertyType: ''
  });

  // ── Webhook Inbox state ──────────────────────────────────────────────
  const [webhookLeads, setWebhookLeads] = useState<WebhookLead[]>([]);
  const [webhookOpen, setWebhookOpen] = useState(true);
  const [webhookOnline, setWebhookOnline] = useState<boolean | null>(null);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [importedWebhookIds, setImportedWebhookIds] = useState<Set<string>>(
    () => new Set(JSON.parse(localStorage.getItem('rf_imported_wh_ids') ?? '[]'))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      const data = await leadStore.getLeads();
      setLeads(data);
    };

    fetchLeads();

    // Abonner på endringer og oppdater asynkront
    return leadStore.subscribe(async () => {
      const data = await leadStore.getLeads();
      setLeads(data);
    });
  }, []);

  // ── Webhook Inbox: init og polling ──────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const online = await webhookService.isAvailable();
      if (!mounted) return;
      setWebhookOnline(online);
      if (!online) return;

      setWebhookLoading(true);
      const all = await webhookService.fetchAll(50);
      if (mounted) {
        setWebhookLeads(all);
        setWebhookLoading(false);
      }
    };

    init();
    webhookService.startPolling();

    const unsub = webhookService.subscribe((newOnes) => {
      setWebhookLeads(prev => {
        const ids = new Set(prev.map(l => l.id));
        return [...newOnes.filter(l => !ids.has(l.id)), ...prev];
      });
    });

    return () => {
      mounted = false;
      webhookService.stopPolling();
      unsub();
    };
  }, []);

  const handleWebhookRefresh = useCallback(async () => {
    setWebhookLoading(true);
    const all = await webhookService.fetchAll(50);
    setWebhookLeads(all);
    setWebhookLoading(false);
  }, []);

  const handleImportWebhookLead = useCallback(async (wl: WebhookLead) => {
    const lead = webhookService.toRealtyFlowLead(wl);
    await leadStore.addLead(lead);
    setImportedWebhookIds(prev => {
      const next = new Set([...prev, wl.id]);
      localStorage.setItem('rf_imported_wh_ids', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const filteredLeads = selectedBrand === 'all' ? leads : leads.filter(l => l.brandId === selectedBrand);
  const totalValue = filteredLeads.reduce((a, b) => a + (b.value || 0), 0);

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEmailAnalysis(null);
    setActiveDetailTab('info');
    setConfirmDelete(false);
  };

  const handleStatusChange = async (status: LeadStatus) => {
    if (!selectedLead) return;
    await leadStore.updateLeadStatus(selectedLead.id, status);
    setSelectedLead(prev => prev ? { ...prev, status } : null);
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    await leadStore.removeLead(selectedLead.id);
    setSelectedLead(null);
    setConfirmDelete(false);
  };

  const handleConvertToCustomer = (lead: Lead) => {
    crmStore.convertFromLead(lead);
    setConvertedLeadIds(prev => new Set([...prev, lead.id]));
    setSelectedLead(null);
    navigate('/crm');
  };

  const handleEmailAnalysis = async () => {
    if (!selectedLead?.emails || selectedLead.emails.length === 0) return;
    setIsAnalyzingEmails(true);
    try {
      const result = await gemini.analyzeEmailThread(selectedLead.emails, selectedLead);
      setEmailAnalysis(result);
      setActiveDetailTab('strategy');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzingEmails(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const lead: Lead = {
        id: `pl-${Date.now()}`,
        name: newLead.name,
        email: newLead.email,
        phone: '',
        source: 'Pipeline Manuel',
        status: LeadStatus.NEW,
        value: parseInt(newLead.value) || 0,
        sentiment: 60,
        urgency: 50,
        intent: 50,
        lastActivity: 'Nylig opprettet',
        summary: newLead.notes,
        brandId: selectedBrand !== 'all' ? selectedBrand : 'soleada',
        emails: [],
        requirements: { 
          budget: parseInt(newLead.value) || 0, 
          location: newLead.location, 
          propertyType: newLead.propertyType, 
          bedrooms: parseInt(newLead.bedrooms) || 0 
        }
      };
      await leadStore.addLead(lead);
      setIsLeadModalOpen(false);
      setNewLead({ name: '', email: '', value: '', notes: '', bedrooms: '', location: '', propertyType: '' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
        <div><h1 className="text-2xl sm:text-4xl font-bold neon-text text-cyan-400">Pipeline</h1><p className="text-slate-400 text-xs mt-1">Verdi: €{(totalValue / 1000000).toFixed(1)}M</p></div>
        <div className="flex gap-2">
          <button onClick={() => setIsLeadModalOpen(true)} className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/20"><UserPlus size={16} /> Ny Lead</button>
        </div>
      </header>

      {/* ── Webhook Inbox ─────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-800 overflow-hidden">
        <button
          onClick={() => setWebhookOpen(v => !v)}
          className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 transition-all"
        >
          <div className="flex items-center gap-3">
            <Webhook size={16} className="text-cyan-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              Webhook Inbox
            </span>
            {webhookOnline === false && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600 font-mono">
                <WifiOff size={10} /> Offline
              </span>
            )}
            {webhookOnline === true && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
            {webhookLeads.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-mono">
                {webhookLeads.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); handleWebhookRefresh(); }}
              className="p-1.5 hover:bg-slate-700 rounded-lg transition-all"
              title="Oppdater"
            >
              <RefreshCw size={12} className={`text-slate-500 ${webhookLoading ? 'animate-spin' : ''}`} />
            </button>
            <ChevronDown
              size={14}
              className={`text-slate-600 transition-transform ${webhookOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>

        {webhookOpen && (
          <div className="p-4">
            {webhookOnline === null && (
              <p className="text-center text-xs text-slate-600 py-6 font-mono">Kobler til Business Hub…</p>
            )}
            {webhookOnline === false && (
              <div className="text-center py-8 opacity-40">
                <WifiOff size={32} className="mx-auto mb-3 text-slate-600" />
                <p className="text-xs text-slate-500 font-mono">Business Hub ikke tilgjengelig</p>
                <p className="text-[10px] text-slate-600 mt-1">Start med: <code>cd business-hub && npm run dev</code></p>
              </div>
            )}
            {webhookOnline === true && webhookLeads.length === 0 && !webhookLoading && (
              <p className="text-center text-xs text-slate-600 py-6 font-mono">Ingen innkommende webhook-leads ennå</p>
            )}
            {webhookOnline === true && webhookLeads.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {webhookLeads.map(wl => {
                  const imported = importedWebhookIds.has(wl.id);
                  const isRE = wl.kilde === 'real-estate';
                  return (
                    <div
                      key={wl.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        imported
                          ? 'border-emerald-500/20 bg-emerald-500/5 opacity-60'
                          : 'border-slate-800 bg-slate-900/40 hover:border-cyan-500/30'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {isRE
                            ? <Building2 size={12} className="text-indigo-400" />
                            : <ShoppingBag size={12} className="text-amber-400" />
                          }
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${isRE ? 'text-indigo-400' : 'text-amber-400'}`}>
                            {isRE ? 'Eiendom' : 'E-commerce'}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-600 font-mono">
                          {new Date(wl.createdAt).toLocaleDateString('no-NO')}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-200 text-sm truncate">{wl.navn}</h4>
                      {wl.epost && <p className="text-[10px] text-slate-500 truncate">{wl.epost}</p>}

                      <div className="mt-2 space-y-0.5">
                        {isRE && wl.lokasjon && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <MapPin size={9} /> {wl.lokasjon}
                          </p>
                        )}
                        {isRE && wl.budsjett && (
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Euro size={9} /> {wl.budsjett.toLocaleString('no-NO')}
                          </p>
                        )}
                        {!isRE && wl.produkt && (
                          <p className="text-[10px] text-slate-400 truncate">{wl.produkt}</p>
                        )}
                        {!isRE && wl.mengde && (
                          <p className="text-[10px] text-slate-400">{wl.mengde} stk</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleImportWebhookLead(wl)}
                        disabled={imported}
                        className={`mt-3 w-full py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 ${
                          imported
                            ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                            : 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                        }`}
                      >
                        {imported
                          ? <><CheckCircle2 size={11} /> Importert</>
                          : <><Plus size={11} /> Legg i Pipeline</>
                        }
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      {/* ── Pipeline kolonner ─────────────────────────────────────── */}
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x no-scrollbar">
        {COLUMNS.map(column => (
          <div key={column.id} className="w-80 flex-shrink-0 flex flex-col gap-4 snap-start">
            <div className="flex items-center justify-between px-2"><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${column.color}`}></div><h3 className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{column.label}</h3></div><span className="text-[10px] text-slate-600 font-mono">{filteredLeads.filter(l => l.status === column.id).length}</span></div>
            <div className="flex-1 bg-slate-900/10 rounded-3xl border border-slate-900/50 p-2 space-y-3 min-h-[400px]">
              {filteredLeads.filter(l => l.status === column.id).map(lead => (
                <div key={lead.id} onClick={() => handleLeadClick(lead)} className="glass p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group">
                  <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-cyan-400">{lead.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1">€{(lead.value / 1000).toFixed(0)}k • {lead.brandId}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex justify-end animate-in slide-in-from-right duration-300">
          <div className="w-full lg:w-[700px] bg-[#0a0a0c] border-l border-slate-800 h-full flex flex-col shadow-2xl">
             <header className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-lg sm:text-2xl font-bold text-white">{selectedLead.name}</h2>
                    <p className="text-xs text-slate-500">{selectedLead.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {convertedLeadIds.has(selectedLead.id) ? (
                      <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <UserCheck size={14} /> Konvertert
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvertToCustomer(selectedLead)}
                        className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                      >
                        <UserCheck size={14} /> Gjør til Kunde
                      </button>
                    )}
                    <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-slate-800 rounded-full"><X size={24} /></button>
                  </div>
                </div>

                {/* ── Statusvalg ── */}
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_ACTIONS.map(sa => (
                    <button
                      key={sa.status}
                      onClick={() => handleStatusChange(sa.status)}
                      className={`px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all ${sa.color} ${sa.bg} ${selectedLead.status === sa.status ? 'ring-1 ring-current opacity-100' : 'opacity-50 hover:opacity-100'}`}
                    >
                      {sa.label}
                    </button>
                  ))}

                  {/* Slett-knapp */}
                  {confirmDelete ? (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <span className="text-[10px] text-red-400 font-bold">Sikker?</span>
                      <button onClick={handleDeleteLead} className="px-3 py-1.5 rounded-lg border border-red-500/50 bg-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/40 transition-all">Ja, slett</button>
                      <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 text-[10px] font-bold hover:bg-slate-800 transition-all">Avbryt</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(true)} className="ml-auto px-3 py-1.5 rounded-lg border border-red-900/40 text-red-500 text-[10px] font-bold hover:bg-red-500/10 transition-all flex items-center gap-1"><Trash2 size={11} /> Slett</button>
                  )}
                </div>
             </header>

             <div className="flex bg-slate-950 p-1 border-b border-slate-800">
                {['info', 'emails', 'strategy'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveDetailTab(tab as any)}
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeDetailTab === tab ? 'text-cyan-400 bg-cyan-500/5' : 'text-slate-600 hover:text-slate-300'}`}
                  >
                    {tab === 'info' ? 'Info' : tab === 'emails' ? 'E-post Historie' : 'AI Handling'}
                  </button>
                ))}
             </div>

             <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                {activeDetailTab === 'info' && (
                  <div className="space-y-6">
                    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl">
                       <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Sammendrag</h4>
                       <p className="text-sm text-slate-300 leading-relaxed">{selectedLead.summary || 'Ingen data.'}</p>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'emails' && (
                  <div className="space-y-4">
                     {(!selectedLead.emails || selectedLead.emails.length === 0) ? (
                       <div className="text-center py-20 opacity-20"><Inbox size={48} className="mx-auto mb-4" /><p className="text-xs font-mono uppercase">Ingen e-poster funnet for denne kunden.</p></div>
                     ) : (
                       <>
                         <button onClick={handleEmailAnalysis} disabled={isAnalyzingEmails} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 mb-4">
                            {isAnalyzingEmails ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} Analyser Tråd med AI
                         </button>
                         {selectedLead.emails.map(email => (
                           <div key={email.id} className={`p-4 rounded-xl border ${email.isIncoming ? 'bg-slate-900 border-slate-800' : 'bg-indigo-500/5 border-indigo-500/20 ml-8'}`}>
                              <div className="flex justify-between text-[10px] font-mono mb-2">
                                 <span className={email.isIncoming ? 'text-cyan-400' : 'text-indigo-400'}>{email.isIncoming ? 'INN' : 'UT'}</span>
                                 <span className="text-slate-600">{email.date}</span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{email.body}</p>
                           </div>
                         ))}
                       </>
                     )}
                  </div>
                )}

                {activeDetailTab === 'strategy' && emailAnalysis && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                     <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Target size={14} /> AI Analyse Resultat</h4>
                        <p className="text-sm text-slate-200 leading-relaxed">{emailAnalysis.summary}</p>
                     </div>
                     <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                        <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-4">Foreslått Handling</h4>
                        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-sm text-white mb-6 italic">"{emailAnalysis.suggestedAction}"</div>
                        <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">E-post utkast (Norsk)</h4>
                        <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{emailAnalysis.suggestedEmailDraft}</div>
                        <button className="w-full mt-6 py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"><SendHorizontal size={16} /> Kopier og Send Svar</button>
                     </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
      
      {isLeadModalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <header className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="text-cyan-400" size={20} /> Opprett Ny Lead
              </h3>
              <button onClick={() => setIsLeadModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </header>
            
            <div className="p-8 space-y-6">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="Navn" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} />
                  <input placeholder="E-post" type="email" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Budsjett (EUR)" type="number" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" value={newLead.value} onChange={e => setNewLead({...newLead, value: e.target.value})} />
                  <input placeholder="Ønsket Sted" className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" value={newLead.location} onChange={e => setNewLead({...newLead, location: e.target.value})} />
                </div>
                <textarea placeholder="Notater om kundens behov..." className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 min-h-[100px]" value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} />
                <button type="submit" disabled={isProcessing} className="w-full py-4 bg-cyan-500 text-slate-950 rounded-2xl font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all">
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Lagre Lead
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipeline;
