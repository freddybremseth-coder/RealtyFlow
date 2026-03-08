
import React, { useState, useEffect, useRef } from 'react';
import { Customer, CustomerStatus, CustomerType, EmailMessage } from '../types';
import { crmStore } from '../services/crmService';
import { emailService } from '../services/emailService';
import { settingsStore } from '../services/settingsService';
import LeadImporter from '../components/LeadImporter';
import {
  Users, Plus, X, Search, Phone, Mail, Star, TrendingUp,
  Euro, MapPin, Loader2, UserCheck, Building2, Home,
  Briefcase, ChevronRight, Trash2, Upload,
  Send, Sparkles, RefreshCw, CheckCircle2, AlertCircle,
  ArrowRight, Inbox, ChevronDown, ChevronUp, Newspaper, FileText,
} from 'lucide-react';

// ─── Typer for AI-fremdrift ────────────────────────────────────────────────

interface NextStep {
  type: 'email' | 'newsletter' | 'prospect' | 'viewing';
  icon: React.ReactNode;
  title: string;
  reason: string;
  draftSubject: string;
  draftBody: string;
}

// ─── AI-kall: generer neste steg for en kunde ──────────────────────────────

async function aiNextSteps(customer: Customer, apiKey: string): Promise<NextStep[]> {
  const emailSummary = (customer.emails ?? [])
    .slice(-5)
    .map(e => `[${e.isIncoming ? 'INN' : 'UT'}] ${e.date.slice(0,10)} – ${e.subject}: ${e.body.slice(0, 120)}`)
    .join('\n');

  const daysSince = Math.floor(
    (Date.now() - new Date(customer.lastContact).getTime()) / 86_400_000,
  );

  const advisorName  = settingsStore.getProfile().name  ?? 'Rådgiver';
  const advisorEmail = settingsStore.getAutomation().emailFromEmail ?? '';

  const prompt = `Du er en ekspert på eiendomssalg og CRM-strategi. Analyser denne kunden og foreslå de 3 beste neste stegene for å drive fremdrift.

KUNDE:
- Navn: ${customer.name}
- Type: ${customer.type}
- Status: ${customer.status}
- Budsjett: ${customer.budget ? `€${customer.budget.toLocaleString()}` : 'ukjent'}
- Område: ${customer.location ?? 'ukjent'}
- Nasjonalitet: ${customer.nationality ?? 'ukjent'}
- Dager siden siste kontakt: ${daysSince}
- Notater: ${customer.notes ?? 'ingen'}
- Tags: ${customer.tags?.join(', ') ?? 'ingen'}

E-POSTHISTORIKK (siste 5):
${emailSummary || 'Ingen e-poster ennå'}

RÅDGIVER: ${advisorName} <${advisorEmail}>

Svar KUN med gyldig JSON-array (ingen markdown-blokk), format:
[
  {
    "type": "email" | "newsletter" | "prospect" | "viewing",
    "title": "Kort tittelbeskrivelse",
    "reason": "Kort begrunnelse (1 setning) på norsk",
    "draftSubject": "Ferdig e-post-emne på norsk",
    "draftBody": "Ferdig e-posttekst på norsk (2-4 avsnitt, profesjonell tone, avslutt med Mvh, ${advisorName})"
  }
]`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '[]';
    const jsonStr = text.match(/\[[\s\S]*\]/)?.[0] ?? '[]';
    const raw = JSON.parse(jsonStr) as Omit<NextStep, 'icon'>[];
    return raw.map(s => ({
      ...s,
      icon:
        s.type === 'email'      ? <Mail size={13} />      :
        s.type === 'newsletter' ? <Newspaper size={13} />  :
        s.type === 'prospect'   ? <FileText size={13} />   :
                                  <CalendarCheck size={13} />,
    }));
  } catch {
    return [];
  }
}

// ─── CalendarCheck icon fallback ──────────────────────────────────────────
const CalendarCheck: React.FC<{size?: number}> = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
    <polyline points="9 16 11 18 15 14"/>
  </svg>
);

// ─── Detaljpanel ───────────────────────────────────────────────────────────

type DetailTab = 'info' | 'email' | 'ai';

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

// ─── CustomerDetailPanel ──────────────────────────────────────────────────

const CustomerDetailPanel: React.FC<{
  customer: Customer;
  onClose: () => void;
  onDelete: () => void;
  onCustomerUpdate: (c: Customer) => void;
}> = ({ customer, onClose, onDelete, onCustomerUpdate }) => {
  const [tab, setTab]             = useState<DetailTab>('info');
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  // Compose
  const [subject, setSubject]     = useState('');
  const [body, setBody]           = useState('');
  const [sending, setSending]     = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  // AI neste steg
  const [aiLoading, setAiLoading] = useState(false);
  const [steps, setSteps]         = useState<NextStep[]>([]);
  const [aiError, setAiError]     = useState('');

  const emails = [...(customer.emails ?? [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    setSendResult(null);

    const result = await emailService.send({
      to: customer.email,
      subject,
      text: body,
    });

    if (result.success) {
      const sent: EmailMessage = {
        id:         `sent-${Date.now()}`,
        date:       new Date().toISOString(),
        from:       settingsStore.getAutomation().emailFromEmail ?? 'meg',
        subject,
        body,
        isIncoming: false,
      };
      crmStore.addEmailToCustomer(customer.id, sent);
      const updated = { ...customer, emails: [...emails, sent], lastContact: new Date().toISOString() };
      onCustomerUpdate(updated);
      setSubject('');
      setBody('');
    }
    setSending(false);
    setSendResult(result.success
      ? { ok: true,  msg: `Sendt til ${customer.email}` }
      : { ok: false, msg: result.error ?? 'Ukjent feil' }
    );
  };

  const handleGenerateAi = async () => {
    setAiLoading(true);
    setAiError('');
    setSteps([]);
    const apiKey = settingsStore.getApiKeys().anthropic;
    if (!apiKey) {
      setAiError('Mangler Anthropic API-nøkkel. Gå til Innstillinger → AI-nøkler.');
      setAiLoading(false);
      return;
    }
    const result = await aiNextSteps(customer, apiKey);
    if (!result.length) setAiError('AI klarte ikke å generere forslag. Prøv igjen.');
    setSteps(result);
    setAiLoading(false);
  };

  const useDraft = (step: NextStep) => {
    setSubject(step.draftSubject);
    setBody(step.draftBody);
    setTab('email');
    setSendResult(null);
  };

  const daysSince = Math.floor(
    (Date.now() - new Date(customer.lastContact).getTime()) / 86_400_000,
  );

  const tabCls = (t: DetailTab) =>
    `flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
      tab === t
        ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400'
        : 'text-slate-500 hover:text-slate-300'
    }`;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-xl flex justify-end animate-in slide-in-from-right duration-300">
      <div className="w-full lg:w-[620px] bg-[#0a0a0c] border-l border-slate-800 h-full flex flex-col shadow-2xl">

        {/* Header */}
        <header className="p-5 border-b border-slate-800 flex items-center gap-4 bg-slate-900/20 shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
            {customer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white truncate">{customer.name}</h2>
            <p className="text-xs text-slate-500">
              {TYPE_CONFIG[customer.type].label} · {STATUS_CONFIG[customer.status].label}
              {daysSince > 0 && <span className={`ml-2 ${daysSince > 14 ? 'text-amber-500' : ''}`}>· Sist kontakt: {daysSince}d siden</span>}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={onDelete} className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-600 rounded-xl transition-colors">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Tab-navbar */}
        <div className="flex gap-1.5 px-5 py-3 border-b border-slate-800 shrink-0 overflow-x-auto no-scrollbar">
          <button onClick={() => setTab('info')}  className={tabCls('info')}>
            Info
          </button>
          <button onClick={() => setTab('email')} className={tabCls('email')}>
            <Mail size={12} />
            E-post
            {emails.length > 0 && (
              <span className="ml-1 bg-cyan-500/20 text-cyan-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {emails.length}
              </span>
            )}
          </button>
          <button onClick={() => { setTab('ai'); if (!steps.length && !aiLoading) handleGenerateAi(); }} className={tabCls('ai')}>
            <Sparkles size={12} />
            AI-fremdrift
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">

          {/* ── INFO ─────────────────────────────────────────────────── */}
          {tab === 'info' && (
            <div className="p-5 space-y-5">
              <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kontaktinfo</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-600 mb-1">E-post</p>
                    <a href={`mailto:${customer.email}`} className="text-sm text-cyan-400 hover:underline break-all">{customer.email}</a>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 mb-1">Telefon</p>
                    <a href={`tel:${customer.phone}`} className="text-sm text-slate-200">{customer.phone}</a>
                  </div>
                  {customer.nationality && <div><p className="text-[10px] text-slate-600 mb-1">Nasjonalitet</p><p className="text-sm text-slate-200">{customer.nationality}</p></div>}
                  {customer.source     && <div><p className="text-[10px] text-slate-600 mb-1">Kilde</p><p className="text-sm text-slate-200">{customer.source}</p></div>}
                  {customer.location   && <div><p className="text-[10px] text-slate-600 mb-1">Område</p><p className="text-sm text-slate-200">{customer.location}</p></div>}
                  {customer.budget     && <div><p className="text-[10px] text-slate-600 mb-1">Budsjett</p><p className="text-sm text-emerald-400 font-bold">€{customer.budget.toLocaleString()}</p></div>}
                </div>
              </div>

              {customer.notes && (
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Notater</h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{customer.notes}</p>
                </div>
              )}

              {customer.tags && customer.tags.length > 0 && (
                <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs text-cyan-400">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setTab('email'); setSubject(`Hei ${customer.name.split(' ')[0]}`); }}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 hover:border-cyan-500/40 hover:text-cyan-400 transition-all">
                  <Mail size={14} /> Skriv e-post
                </button>
                <a href={`tel:${customer.phone}`}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-all">
                  <Phone size={14} /> Ring
                </a>
              </div>

              <div className="flex gap-4 text-[10px] text-slate-600">
                <span>Opprettet: {new Date(customer.createdAt).toLocaleDateString('nb-NO')}</span>
                <span>Sist kontakt: {new Date(customer.lastContact).toLocaleDateString('nb-NO')}</span>
              </div>
            </div>
          )}

          {/* ── E-POST ───────────────────────────────────────────────── */}
          {tab === 'email' && (
            <div className="p-5 space-y-5">

              {/* Tråd */}
              {emails.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center opacity-40">
                  <Inbox size={32} />
                  <p className="text-xs">Ingen e-poster ennå</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emails.map(em => {
                    const isExpanded = expandedEmail === em.id;
                    return (
                      <div
                        key={em.id}
                        className={`flex ${em.isIncoming ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl border text-xs cursor-pointer transition-all ${
                            em.isIncoming
                              ? 'bg-slate-900 border-slate-700 rounded-tl-sm'
                              : 'bg-cyan-500/10 border-cyan-500/20 rounded-tr-sm'
                          }`}
                          onClick={() => setExpandedEmail(isExpanded ? null : em.id)}
                        >
                          <div className="px-4 py-3">
                            <div className="flex items-center justify-between gap-3 mb-1">
                              <span className={`font-bold text-[11px] ${em.isIncoming ? 'text-slate-300' : 'text-cyan-400'}`}>
                                {em.isIncoming ? customer.name.split(' ')[0] : 'Deg'}
                              </span>
                              <span className="text-[10px] text-slate-600 shrink-0">
                                {new Date(em.date).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className={`font-semibold mb-1 ${em.isIncoming ? 'text-slate-200' : 'text-cyan-300'}`}>
                              {em.subject}
                            </p>
                            <p className="text-slate-500 text-[11px] leading-relaxed">
                              {isExpanded ? em.body : em.body.slice(0, 80) + (em.body.length > 80 ? '…' : '')}
                            </p>
                          </div>
                          <div className={`px-4 pb-2 flex items-center gap-1 text-[10px] ${em.isIncoming ? 'text-slate-600' : 'text-cyan-600'}`}>
                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            {isExpanded ? 'Skjul' : 'Les hele'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compose */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center gap-2">
                  <Send size={13} className="text-cyan-400" />
                  <span className="text-xs font-bold text-slate-300">Skriv ny e-post til {customer.name.split(' ')[0]}</span>
                </div>
                <div className="p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Emne"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600"
                  />
                  <textarea
                    placeholder={`Hei ${customer.name.split(' ')[0]},\n\n`}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-600 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-600">
                      Til: <span className="text-slate-400">{customer.email}</span>
                    </p>
                    <button
                      onClick={handleSend}
                      disabled={sending || !subject.trim() || !body.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all disabled:opacity-40"
                    >
                      {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      {sending ? 'Sender…' : 'Send e-post'}
                    </button>
                  </div>

                  {sendResult && (
                    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs border animate-in fade-in ${
                      sendResult.ok
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {sendResult.ok ? <CheckCircle2 size={12} className="mt-0.5 shrink-0" /> : <AlertCircle size={12} className="mt-0.5 shrink-0" />}
                      {sendResult.msg}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── AI-FREMDRIFT ─────────────────────────────────────────── */}
          {tab === 'ai' && (
            <div className="p-5 space-y-5">

              {/* Regenerer-knapp */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-200">AI-fremdriftsforslag</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Basert på kundeprofil, budsjett og e-posthistorikk
                  </p>
                </div>
                <button
                  onClick={handleGenerateAi}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
                >
                  {aiLoading
                    ? <><Loader2 size={11} className="animate-spin" /> Analyserer…</>
                    : <><RefreshCw size={11} /> Analyser på nytt</>
                  }
                </button>
              </div>

              {/* Laster */}
              {aiLoading && (
                <div className="flex flex-col items-center gap-4 py-14 text-center">
                  <div className="relative">
                    <Sparkles size={36} className="text-indigo-400" />
                    <Loader2 size={16} className="animate-spin text-cyan-400 absolute -top-1 -right-1" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300 mb-1">AI analyserer {customer.name}…</p>
                    <p className="text-xs text-slate-600">Ser på e-posthistorikk, budsjett og kundestatus</p>
                  </div>
                </div>
              )}

              {/* Feil */}
              {aiError && !aiLoading && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  {aiError}
                </div>
              )}

              {/* Forslag */}
              {!aiLoading && steps.length > 0 && steps.map((step, i) => (
                <div
                  key={i}
                  className="border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/30 transition-all group"
                >
                  <div className="px-5 py-4 bg-slate-900/40">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                        {step.icon}
                      </span>
                      <span className="text-xs font-bold text-slate-200">{step.title}</span>
                      <span className="ml-auto text-[9px] font-mono uppercase text-slate-600 bg-slate-800 px-2 py-0.5 rounded-full">
                        {step.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{step.reason}</p>
                  </div>

                  {/* Utkast-forhåndsvisning */}
                  <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800">
                    <p className="text-[10px] font-mono text-slate-600 mb-1">Emne: {step.draftSubject}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {step.draftBody.slice(0, 100)}…
                    </p>
                  </div>

                  <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={() => useDraft(step)}
                      className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Bruk dette utkastet <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Tom state */}
              {!aiLoading && !aiError && steps.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-14 text-center opacity-40">
                  <Sparkles size={36} />
                  <p className="text-xs">Klikk «Analyser på nytt» for å generere forslag</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Hoved-CRM ────────────────────────────────────────────────────────────

const CRM: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(crmStore.getCustomers());
  const [selected, setSelected] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | CustomerStatus>('all');
  const [filterType, setFilterType] = useState<'all' | CustomerType>('all');
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    const unsub = crmStore.subscribe(() => setCustomers(crmStore.getCustomers()));
    return unsub;
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
      <LeadImporter isOpen={isImporterOpen} onClose={() => setIsImporterOpen(false)} />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold neon-text text-cyan-400">Kundekort</h1>
          <p className="text-slate-400 text-xs mt-1">{stats.total} kunder · {stats.vip} VIP · €{(stats.totalVal / 1000000).toFixed(1)}M portefølje</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="px-6 py-3 bg-slate-800 text-cyan-400 border border-slate-700 rounded-2xl font-bold flex items-center gap-2 text-xs hover:bg-slate-700 transition-all"
            >
            <Upload size={16} /> Importer Leads
          </button>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-6 py-3 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center gap-2 text-xs shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all"
            >
            <Plus size={16} /> Ny Kunde
          </button>
        </div>
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
        <CustomerDetailPanel
          customer={selected}
          onClose={() => setSelected(null)}
          onDelete={() => handleDelete(selected.id)}
          onCustomerUpdate={(c) => setSelected(c)}
        />
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
