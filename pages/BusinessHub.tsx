import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Inbox, Users, Megaphone,
  Building2, ShoppingBag, Leaf, Bot, BookOpen, Zap,
  TrendingUp, TrendingDown, Euro, Mail, Phone,
  Clock, CheckCircle2, AlertCircle, Circle,
  Sparkles, Play, Loader2, Copy, Check,
  MoreHorizontal, RefreshCw,
  Globe, Star, ChevronRight, BarChart3,
  Send, FileText, Link2,
  Flame, Target, Activity, Facebook, Instagram, Newspaper,
  Languages, X, AtSign
} from 'lucide-react';
import { gemini } from '../services/claudeService';
import { settingsStore } from '../services/settingsService';
import { emailService } from '../services/emailService';
import { leadStore } from '../services/leadService';
import { Lead, LeadStatus as PipelineStatus } from '../types';

// ─── Typer ────────────────────────────────────────────────────────────────────

type TabId = 'oversikt' | 'innboks' | 'crm' | 'marketing';
type LeadStatus = 'ny' | 'kontaktet' | 'kvalifisert' | 'tapt' | 'vunnet';
type Source = 'soleada' | 'donaanna' | 'zeneco' | 'pinosoecolife' | 'chatgenius' | 'freddy';

interface InboxLead {
  id: string;
  navn: string;
  epost: string;
  telefon?: string;
  kilde: Source;
  status: LeadStatus;
  melding: string;
  tidspunkt: string;
  verdi?: number;
  isNew?: boolean;
}

interface KpiCard {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  icon: React.ReactNode;
  color: string;
}

interface AiTask {
  id: string;
  label: string;
  brand: Source;
  prompt: string;
}

// ─── Kilde-konfigurasjon ──────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<Source, {
  label: string; shortLabel: string;
  color: string; bg: string; border: string;
  textColor: string; icon: React.ReactNode;
  url: string; type: string;
}> = {
  soleada: {
    label: 'Soleada.no', shortLabel: 'Soleada',
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/25',
    textColor: '#22d3ee', icon: <Building2 size={12} />,
    url: 'soleada.no', type: 'Eiendom',
  },
  donaanna: {
    label: 'DonaAnna.no', shortLabel: 'Dona Anna',
    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/25',
    textColor: '#fb923c', icon: <ShoppingBag size={12} />,
    url: 'donaanna.no', type: 'E-commerce',
  },
  zeneco: {
    label: 'ZenEcoHomes.com', shortLabel: 'Zen Eco',
    color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/25',
    textColor: '#818cf8', icon: <Zap size={12} />,
    url: 'zenecohomes.com', type: 'Eiendom',
  },
  pinosoecolife: {
    label: 'Pinosoecolife.com', shortLabel: 'Pinoso Eco',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25',
    textColor: '#34d399', icon: <Leaf size={12} />,
    url: 'pinosoecolife.com', type: 'Eiendom',
  },
  chatgenius: {
    label: 'ChatGenius.pro', shortLabel: 'ChatGenius',
    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/25',
    textColor: '#a78bfa', icon: <Bot size={12} />,
    url: 'chatgenius.pro', type: 'SaaS',
  },
  freddy: {
    label: 'FreddyB.no', shortLabel: 'Freddy B.',
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/25',
    textColor: '#fbbf24', icon: <BookOpen size={12} />,
    url: 'freddyb.no', type: 'Personal',
  },
};

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  ny:          { label: 'Ny',          color: 'text-cyan-400',    bg: 'bg-cyan-500/10',    icon: <Circle size={8} fill="#22d3ee" /> },
  kontaktet:   { label: 'Kontaktet',   color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  icon: <Clock size={8} /> },
  kvalifisert: { label: 'Kvalifisert', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: <CheckCircle2 size={8} /> },
  tapt:        { label: 'Tapt',        color: 'text-red-400',     bg: 'bg-red-500/10',     icon: <AlertCircle size={8} /> },
  vunnet:      { label: 'Vunnet',      color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10', icon: <Star size={8} /> },
};

// ─── Mock-data ────────────────────────────────────────────────────────────────

const MOCK_LEADS: InboxLead[] = [
  {
    id: '1', navn: 'Lars Eriksen', epost: 'lars.e@gmail.com', telefon: '+47 924 11 223',
    kilde: 'soleada', status: 'ny', isNew: true,
    melding: 'Hei! Ser etter villa med basseng nær Altea, budsjett ca €450 000. Kan vi snakkes?',
    tidspunkt: '3 min siden', verdi: 450000,
  },
  {
    id: '2', navn: 'Maria Santos', epost: 'maria.s@hotmail.com', telefon: '+34 611 234 567',
    kilde: 'donaanna', status: 'ny', isNew: true,
    melding: 'Ønsker fast levering av 12 flasker Extra Virgin per måned til restaurant. Mulig engros-pris?',
    tidspunkt: '18 min siden',
  },
  {
    id: '3', navn: 'Thomas Berg', epost: 'thomas.berg@company.no', telefon: '+47 901 44 532',
    kilde: 'soleada', status: 'kontaktet',
    melding: 'Leter etter leilighet 2-3 soverom, Benidorm eller Calpe, innflyttingsklar. Budsjett €280 000.',
    tidspunkt: '1 time siden', verdi: 280000,
  },
  {
    id: '4', navn: 'Anne-Lise Dahl', epost: 'annelise@dahl.as',
    kilde: 'pinosoecolife', status: 'ny', isNew: true,
    melding: 'Interessert i finca med oliven- og mandeltrær i Pinoso-området, ca 5 000 m². Kan du sende bilder?',
    tidspunkt: '2 timer siden', verdi: 185000,
  },
  {
    id: '5', navn: 'Per-Arne Haugen', epost: 'per@haugen-bygg.no', telefon: '+47 976 55 100',
    kilde: 'zeneco', status: 'kvalifisert',
    melding: 'Vil kjøpe 2 leiligheter i nybygg som investering. Venter på finansieringsbekreftelse fra banken.',
    tidspunkt: '3 timer siden', verdi: 680000,
  },
  {
    id: '6', navn: 'Sofia Martinsen', epost: 'sofia@startup.io', telefon: '+47 455 33 210',
    kilde: 'chatgenius', status: 'ny', isNew: true,
    melding: 'Vil prøve ChatGenius til vår nettbutikk. Trenger AI-chat på norsk og engelsk. Hva koster Business-planen?',
    tidspunkt: '4 timer siden',
  },
  {
    id: '7', navn: 'Ingrid Olsen', epost: 'ingrid.o@outlook.com',
    kilde: 'donaanna', status: 'vunnet',
    melding: 'Bestilling gjennomført – 6 flasker Premium 500ml sendt til Oslo. Veldig fornøyd!',
    tidspunkt: 'I går', verdi: 890,
  },
  {
    id: '8', navn: 'Bjørn Aasen', epost: 'baasen@gmail.com', telefon: '+47 900 12 345',
    kilde: 'freddy', status: 'kontaktet',
    melding: 'Leste boka di og ønsker rådgivning om å investere i Spania. Kan vi ta en prat?',
    tidspunkt: 'I går',
  },
  {
    id: '9', navn: 'Kari Nygaard', epost: 'kari.n@mail.no', telefon: '+47 412 87 654',
    kilde: 'soleada', status: 'kvalifisert',
    melding: 'Ønsker visning av Villa Mirador i Altea Hills denne uken. Er tilgjengelig torsdag eller fredag.',
    tidspunkt: 'I går', verdi: 595000,
  },
  {
    id: '10', navn: 'Jonas Strand', epost: 'jonas@strand-group.no',
    kilde: 'zeneco', status: 'ny',
    melding: 'Hei, ser etter 3-roms nybygg med terrasse. Har sett på Zen Evo Phase 3. Priser tilgjengelig?',
    tidspunkt: '2 dager siden', verdi: 340000,
  },
];

const KPI_DATA: KpiCard[] = [
  {
    label: 'Aktive leads', value: '47', delta: '+12 denne uken', positive: true,
    icon: <Users size={18} />, color: 'text-cyan-400',
  },
  {
    label: 'Pipeline-verdi', value: '€ 3.2M', delta: '+€420k fra forrige uke', positive: true,
    icon: <Euro size={18} />, color: 'text-emerald-400',
  },
  {
    label: 'Konverteringsrate', value: '23%', delta: '+4% vs forrige mnd', positive: true,
    icon: <Target size={18} />, color: 'text-indigo-400',
  },
  {
    label: 'Åpne oppgaver', value: '8', delta: '3 forfaller i dag', positive: false,
    icon: <AlertCircle size={18} />, color: 'text-amber-400',
  },
];

const AI_TASKS: AiTask[] = [
  { id: 'a1', label: 'Skriv oppfølgings-e-post til eiendomslead', brand: 'soleada', prompt: 'Skriv en profesjonell og varm oppfølgings-e-post fra Soleada.no til en lead som er interessert i villa i Altea, budsjett €450 000. Inkluder verdiforslag og call-to-action.' },
  { id: 'a2', label: 'Instagram-post: ny olivenolje-høst', brand: 'donaanna', prompt: 'Skriv en engasjerende Instagram-post for Dona Anna om ny olivenolje-høst fra Andalusia. Autentisk tone, avslutt med 3 relevante hashtags.' },
  { id: 'a3', label: 'Facebook-annonsetekst for nybygg', brand: 'zeneco', prompt: 'Skriv en kortfattet Facebook-annonse for Zen Eco Homes som fremhever A-energimerking, moderne design og investerings-potensiale. Målgruppe: nordmenn 40-60 år.' },
  { id: 'a4', label: 'Blogg: kjøpe finca i innlandet', brand: 'pinosoecolife', prompt: 'Skriv en introduksjon (3 avsnitt) til en bloggartikkel om å kjøpe finca i Pinoso-regionen for Pinosoecolife.com. Autentisk, inspirerende og praktisk tone.' },
  { id: 'a5', label: 'Salgsside-kopi for ChatGenius Business', brand: 'chatgenius', prompt: 'Skriv overbevisende overskrift, underoverskrift og 3 bullet-points for ChatGenius Business-plan rettet mot norske nettbutikker.' },
  { id: 'a6', label: 'LinkedIn: rådgivning om Spania-investering', brand: 'freddy', prompt: 'Skriv et LinkedIn-innlegg fra Freddy B. om 3 ting folk ikke tenker på før de investerer i spansk eiendom. Autoritativ og personlig tone.' },
];

const ACTIVITY_FEED = [
  { text: 'Ny lead fra Soleada.no', sub: 'Lars Eriksen — villa Altea €450k', time: '3 min', dot: 'bg-cyan-400' },
  { text: 'Ny bestilling via Dona Anna', sub: 'Maria Santos — engros olivenolje', time: '18 min', dot: 'bg-orange-400' },
  { text: 'Lead kvalifisert', sub: 'Per-Arne Haugen — Zen Eco nybygg', time: '3t', dot: 'bg-emerald-400' },
  { text: 'Lead vunnet 🎉', sub: 'Ingrid Olsen — DonaAnna bestilling', time: 'I går', dot: 'bg-fuchsia-400' },
  { text: 'Ny forespørsel via ChatGenius', sub: 'Sofia Martinsen — Business plan', time: '4t', dot: 'bg-violet-400' },
];

// ─── Lead → InboxLead mapper ─────────────────────────────────────────────────

const STATUS_PIPE_MAP: Record<string, LeadStatus> = {
  NEW:         'ny',
  QUALIFIED:   'kvalifisert',
  VIEWING:     'kontaktet',
  NEGOTIATION: 'kontaktet',
  WON:         'vunnet',
  LOST:        'tapt',
};

function leadToInboxLead(lead: Lead): InboxLead {
  const kilde = (lead.brandId ?? 'soleada') as Source;
  const status = STATUS_PIPE_MAP[lead.status] ?? 'ny';
  return {
    id:       lead.id,
    navn:     lead.name,
    epost:    lead.email,
    telefon:  lead.phone || undefined,
    kilde:    Object.prototype.hasOwnProperty.call(SOURCE_CONFIG, kilde) ? kilde : 'soleada',
    status,
    isNew:    status === 'ny',
    melding:  lead.summary ?? `${lead.source ?? ''} henvendelse`,
    tidspunkt: lead.lastActivity ?? '',
    verdi:    lead.value > 0 ? lead.value : undefined,
  };
}

// ─── Sub-komponenter ──────────────────────────────────────────────────────────

const SourceTag: React.FC<{ source: Source; size?: 'sm' | 'xs' }> = ({ source, size = 'sm' }) => {
  const cfg = SOURCE_CONFIG[source];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${cfg.bg} ${cfg.border} ${cfg.color}`}
    >
      {cfg.icon}
      {cfg.shortLabel}
    </span>
  );
};

const StatusBadge: React.FC<{ status: LeadStatus }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
};

// ─── Faner ────────────────────────────────────────────────────────────────────

const OversiktTab: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    leadStore.getLeads().then(setLeads);
    return leadStore.subscribe(() => leadStore.getLeads().then(setLeads));
  }, []);

  // ── Beregn KPI-er fra ekte data ──────────────────────────────────────────
  const activeLeads  = leads.filter(l => l.status !== PipelineStatus.LOST);
  const wonLeads     = leads.filter(l => l.status === PipelineStatus.WON);
  const newLeads     = leads.filter(l => l.status === PipelineStatus.NEW);
  const pipelineVal  = leads.reduce((sum, l) => sum + (l.value ?? 0), 0);
  const convRate     = leads.length > 0
    ? Math.round((wonLeads.length / leads.length) * 100)
    : 0;

  const kpis = [
    {
      label: 'Aktive leads',
      value: String(activeLeads.length),
      delta: newLeads.length > 0 ? `${newLeads.length} nye uten kontakt` : 'Alle fulgt opp',
      positive: true,
      icon: <Users size={18} />, color: 'text-cyan-400',
    },
    {
      label: 'Pipeline-verdi',
      value: pipelineVal >= 1_000_000
        ? `€ ${(pipelineVal / 1_000_000).toFixed(1)}M`
        : pipelineVal > 0
          ? `€ ${pipelineVal.toLocaleString('no-NO')}`
          : '€ 0',
      delta: `${wonLeads.length} vunnet`,
      positive: wonLeads.length > 0,
      icon: <Euro size={18} />, color: 'text-emerald-400',
    },
    {
      label: 'Konverteringsrate',
      value: `${convRate}%`,
      delta: leads.length > 0
        ? `${wonLeads.length} av ${leads.length} leads`
        : 'Ingen leads ennå',
      positive: convRate > 0,
      icon: <Target size={18} />, color: 'text-indigo-400',
    },
    {
      label: 'Nye leads',
      value: String(newLeads.length),
      delta: newLeads.length > 0 ? 'Venter på oppfølging' : 'Ingen i kø',
      positive: newLeads.length === 0,
      icon: <AlertCircle size={18} />, color: 'text-amber-400',
    },
  ];

  // ── Antall leads per merkevare ───────────────────────────────────────────
  const countByBrand = (key: string) =>
    leads.filter(l => l.brandId === key).length;

  const maxCount = Math.max(
    1,
    ...Object.keys(SOURCE_CONFIG).map(k => countByBrand(k)),
  );

  // ── Siste 5 leads som aktivitetsstrøm ───────────────────────────────────
  const recentLeads = leads.slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* KPI-kort */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">{kpi.label}</span>
              <span className={kpi.color}>{kpi.icon}</span>
            </div>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className={`text-[10px] flex items-center gap-1 ${kpi.positive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {kpi.positive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {kpi.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Leads per nettside – teller fra ekte leadStore */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <BarChart3 size={12} className="text-cyan-400" /> Leads per nettside
          </h3>
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
            const count = countByBrand(key);
            const pct   = Math.round((count / maxCount) * 100);
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <span className="text-xs text-slate-300">{cfg.shortLabel}</span>
                    <span className="text-[9px] text-slate-600 font-mono">{cfg.type}</span>
                  </div>
                  <span className={`text-xs font-bold ${count === 0 ? 'text-slate-600' : cfg.color}`}>
                    {count}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: count === 0 ? '#1e293b' : cfg.textColor }}
                  />
                </div>
              </div>
            );
          })}
          {leads.length === 0 && (
            <p className="text-[10px] text-slate-600 text-center py-2">
              Ingen leads importert ennå
            </p>
          )}
        </div>

        {/* Aktivitetsstrøm – siste ekte leads */}
        <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-cyan-400" /> Siste aktivitet
          </h3>
          <div className="space-y-4">
            {recentLeads.length === 0 && (
              <p className="text-[10px] text-slate-600">Ingen leads ennå</p>
            )}
            {recentLeads.map((lead, i) => {
              const srcKey = (lead.brandId ?? 'soleada') as Source;
              const cfg    = SOURCE_CONFIG[srcKey] ?? SOURCE_CONFIG.soleada;
              return (
                <div key={lead.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: cfg.textColor }}
                    />
                    {i < recentLeads.length - 1 && (
                      <div className="w-px flex-1 bg-slate-800 mt-1" />
                    )}
                  </div>
                  <div className="pb-3">
                    <p className="text-xs text-slate-200 font-medium">
                      Ny lead — {cfg.shortLabel}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {lead.name}
                      {lead.value > 0 ? ` · €${lead.value.toLocaleString('no-NO')}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-700 font-mono mt-0.5">
                      {lead.lastActivity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Nettside-oversikt */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
          <Globe size={12} className="text-cyan-400" /> Nettsider tilkoblet Business Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
            const count = countByBrand(key);
            return (
              <div key={key} className={`p-4 rounded-2xl border ${cfg.bg} ${cfg.border} space-y-2`}>
                <div className={cfg.color}>{cfg.icon}</div>
                <p className={`text-xs font-bold ${cfg.color}`}>{cfg.shortLabel}</p>
                <p className="text-[9px] text-slate-600 font-mono">{cfg.url}</p>
                <p className={`text-[10px] font-bold ${count === 0 ? 'text-slate-600' : cfg.color}`}>
                  {count} lead{count !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[9px] text-emerald-400 font-mono">Live</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─── AI Reply-panel (brukes inne i InnboksTab) ────────────────────────────────
interface AiReplyState {
  loading: boolean;
  subject: string;
  body: string;
  lang: string;
  copied: boolean;
  sending: boolean;
  sendResult: { ok: boolean; msg: string } | null;
}

const LeadAiReply: React.FC<{ lead: InboxLead }> = ({ lead }) => {
  const [state, setState] = useState<AiReplyState>({
    loading: false, subject: '', body: '', lang: '',
    copied: false, sending: false, sendResult: null,
  });

  const LANG_LABEL: Record<string, string> = {
    no: '🇳🇴 Norsk', en: '🇬🇧 Engelsk', es: '🇪🇸 Spansk',
    de: '🇩🇪 Tysk',  fr: '🇫🇷 Fransk', ru: '🇷🇺 Russisk',
  };

  const handleGenerate = async () => {
    setState(s => ({ ...s, loading: true, subject: '', body: '', sent: false }));
    try {
      const res = await gemini.generateLeadReply(lead.melding, lead.navn, lead.kilde);
      setState(s => ({ ...s, loading: false, subject: res.subject, body: res.body, lang: res.detectedLanguage }));
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, body: `Feil: ${err.message}` }));
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`Emne: ${state.subject}\n\n${state.body}`);
    setState(s => ({ ...s, copied: true }));
    setTimeout(() => setState(s => ({ ...s, copied: false })), 2000);
  };

  const handleSend = async () => {
    setState(s => ({ ...s, sending: true, sendResult: null }));
    const result = await emailService.send({
      to:      lead.epost,
      subject: state.subject,
      text:    state.body,
      replyTo: settingsStore.getAutomation().emailFromEmail,
    });
    setState(s => ({
      ...s,
      sending: false,
      sendResult: result.success
        ? { ok: true,  msg: `Sendt til ${lead.epost}` }
        : { ok: false, msg: result.error ?? 'Ukjent feil' },
    }));
  };

  return (
    <div className="space-y-3">
      {/* Generer-knapp */}
      {!state.body && (
        <button
          onClick={handleGenerate}
          disabled={state.loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 transition-all disabled:opacity-50"
        >
          {state.loading
            ? <><Loader2 size={13} className="animate-spin" /> Analyserer og skriver…</>
            : <><Sparkles size={13} /> Generer AI Svar</>
          }
        </button>
      )}

      {/* E-postutkast */}
      {state.body && !state.loading && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 overflow-hidden animate-in slide-in-from-top-2 duration-300">
          {/* Toppbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-indigo-500/15 bg-indigo-500/5">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Utkast</span>
              {state.lang && (
                <span className="text-[10px] text-indigo-300/60 font-mono flex items-center gap-1">
                  <Languages size={9} /> {LANG_LABEL[state.lang] ?? state.lang}
                </span>
              )}
            </div>
            <button
              onClick={() => setState(s => ({ ...s, subject: '', body: '' }))}
              className="text-slate-600 hover:text-slate-400 transition-all"
            >
              <X size={13} />
            </button>
          </div>

          {/* Emne */}
          <div className="px-4 py-2.5 border-b border-indigo-500/10 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-600 w-12 uppercase">Emne</span>
            <input
              className="flex-1 bg-transparent text-xs text-slate-300 focus:outline-none"
              value={state.subject}
              onChange={e => setState(s => ({ ...s, subject: e.target.value }))}
            />
          </div>

          {/* Til */}
          <div className="px-4 py-2 border-b border-indigo-500/10 flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-600 w-12 uppercase">Til</span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <AtSign size={9} /> {lead.epost}
            </span>
          </div>

          {/* Brødtekst */}
          <textarea
            className="w-full bg-transparent px-4 py-3 text-sm text-slate-300 leading-relaxed resize-none focus:outline-none"
            rows={Math.min(state.body.split('\n').length + 2, 14)}
            value={state.body}
            onChange={e => setState(s => ({ ...s, body: e.target.value }))}
          />

          {/* Handlinger */}
          <div className="flex flex-col gap-2 px-4 py-3 border-t border-indigo-500/15 bg-indigo-500/5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSend}
                disabled={state.sending}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all disabled:opacity-50"
              >
                {state.sending
                  ? <><Loader2 size={13} className="animate-spin" /> Sender…</>
                  : <><Send size={13} /> Send e-post</>
                }
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition-all"
              >
                {state.copied ? <><Check size={13} className="text-emerald-400" /> Kopiert!</> : <><Copy size={13} /> Kopier</>}
              </button>
              <button
                onClick={handleGenerate}
                className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-slate-400 transition-all"
              >
                <RefreshCw size={10} /> Ny versjon
              </button>
            </div>

            {/* Send-resultat */}
            {state.sendResult && (
              <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs border animate-in fade-in duration-200 ${state.sendResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {state.sendResult.ok ? <CheckCircle2 size={12} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />}
                {state.sendResult.msg}
                {!state.sendResult.ok && (
                  <a href="/settings" className="ml-auto underline whitespace-nowrap text-slate-500 hover:text-slate-300">
                    Innstillinger →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── InnboksTab ───────────────────────────────────────────────────────────────
const InnboksTab: React.FC = () => {
  const [filter, setFilter] = useState<Source | 'alle'>('alle');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'alle'>('alle');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showReply, setShowReply] = useState<string | null>(null);
  const [allLeads, setAllLeads] = useState<InboxLead[]>([]);

  useEffect(() => {
    leadStore.getLeads().then(leads => setAllLeads(leads.map(leadToInboxLead)));
    return leadStore.subscribe(() =>
      leadStore.getLeads().then(leads => setAllLeads(leads.map(leadToInboxLead)))
    );
  }, []);

  const filtered = allLeads.filter(l => {
    const matchKilde = filter === 'alle' || l.kilde === filter;
    const matchStatus = statusFilter === 'alle' || l.status === statusFilter;
    return matchKilde && matchStatus;
  });

  const nyeLeads = allLeads.filter(l => l.isNew).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header med stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-cyan-400">{nyeLeads} nye leads</span>
          </div>
          <span className="text-xs text-slate-500">{allLeads.length} totalt</span>
        </div>
        <button className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-all">
          <RefreshCw size={12} /> Oppdater
        </button>
      </div>

      {/* Kilde-filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('alle')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === 'alle' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
        >
          Alle kilder
        </button>
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setFilter(key as Source)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
          >
            {cfg.icon} {cfg.shortLabel}
          </button>
        ))}
      </div>

      {/* Status-filter */}
      <div className="flex flex-wrap gap-2">
        {(['alle', 'ny', 'kontaktet', 'kvalifisert', 'vunnet', 'tapt'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all capitalize ${statusFilter === s ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-900/30 border-slate-800 text-slate-600 hover:text-slate-400'}`}
          >
            {s === 'alle' ? 'Alle statuser' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Lead-liste */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-600">
            <Inbox size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Ingen leads matcher filteret</p>
          </div>
        )}
        {filtered.map(lead => {
          const src = SOURCE_CONFIG[lead.kilde];
          const isOpen = expanded === lead.id;
          const isReplying = showReply === lead.id;
          return (
            <div
              key={lead.id}
              className={`glass rounded-2xl border transition-all ${isOpen ? `${src.border} ${src.bg}` : 'border-slate-800 hover:border-slate-700'}`}
            >
              {/* Hode — klikk for å ekspandere */}
              <div
                className="p-4 flex items-start gap-4 cursor-pointer"
                onClick={() => {
                  setExpanded(isOpen ? null : lead.id);
                  if (isOpen) setShowReply(null);
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm"
                  style={{ background: src.textColor + '18', color: src.textColor }}
                >
                  {lead.navn.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-200">{lead.navn}</span>
                    {lead.isNew && (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase bg-cyan-500 text-slate-950">NY</span>
                    )}
                    <SourceTag source={lead.kilde} />
                    <StatusBadge status={lead.status} />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                    <Mail size={9} /> {lead.epost}
                    {lead.telefon && <><Phone size={9} /> {lead.telefon}</>}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{lead.melding}</p>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-[9px] text-slate-600 font-mono whitespace-nowrap">{lead.tidspunkt}</span>
                  {lead.verdi && (
                    <span className="text-xs font-bold text-emerald-400">
                      €{lead.verdi >= 1000 ? (lead.verdi / 1000).toFixed(0) + 'k' : lead.verdi}
                    </span>
                  )}
                  <ChevronRight size={14} className={`text-slate-600 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Ekspandert panel */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  {/* Melding */}
                  <div className="bg-slate-950/60 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Kundens melding</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{lead.melding}</p>
                  </div>

                  {/* Handlingsknapper */}
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowReply(isReplying ? null : lead.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isReplying ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20'}`}
                    >
                      <Sparkles size={12} /> Generer AI Svar
                    </button>
                    <button
                      onClick={() => window.open(`mailto:${lead.epost}`, '_blank')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700"
                    >
                      <Mail size={12} /> Skriv manuelt
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700">
                      <Phone size={12} /> Ring
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                      <CheckCircle2 size={12} /> Kvalifiser
                    </button>
                  </div>

                  {/* AI Svar-panel */}
                  {isReplying && <LeadAiReply lead={lead} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CrmTab: React.FC = () => {
  const [allLeads, setAllLeads] = useState<InboxLead[]>([]);

  useEffect(() => {
    leadStore.getLeads().then(leads => setAllLeads(leads.map(leadToInboxLead)));
    return leadStore.subscribe(() =>
      leadStore.getLeads().then(leads => setAllLeads(leads.map(leadToInboxLead)))
    );
  }, []);

  const cols: { status: LeadStatus; label: string; color: string }[] = [
    { status: 'ny',          label: 'Ny',          color: 'bg-cyan-500' },
    { status: 'kontaktet',   label: 'Kontaktet',   color: 'bg-indigo-500' },
    { status: 'kvalifisert', label: 'Kvalifisert', color: 'bg-emerald-500' },
    { status: 'vunnet',      label: 'Vunnet',      color: 'bg-fuchsia-500' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Pipeline-verdi */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cols.map(col => {
          const leads = allLeads.filter(l => l.status === col.status);
          const verdi = leads.reduce((s, l) => s + (l.verdi || 0), 0);
          return (
            <div key={col.status} className="glass p-4 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{col.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{leads.length}</p>
              {verdi > 0 && <p className="text-[10px] text-emerald-400 font-mono">€{(verdi / 1000).toFixed(0)}k</p>}
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar">
        {cols.map(col => {
          const leads = allLeads.filter(l => l.status === col.status);
          return (
            <div key={col.status} className="w-72 flex-shrink-0 flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{col.label}</span>
                <span className="text-[10px] text-slate-700 font-mono ml-auto">{leads.length}</span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {leads.map(lead => {
                  const src = SOURCE_CONFIG[lead.kilde];
                  return (
                    <div key={lead.id} className="glass p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-3 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-200">{lead.navn}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{lead.epost}</p>
                        </div>
                        <button className="text-slate-700 hover:text-slate-400 transition-all">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{lead.melding}</p>
                      <div className="flex items-center justify-between">
                        <SourceTag source={lead.kilde} />
                        {lead.verdi && (
                          <span className="text-[10px] font-bold text-emerald-400">
                            €{lead.verdi >= 1000 ? (lead.verdi / 1000).toFixed(0) + 'k' : lead.verdi}
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-700 font-mono">{lead.tidspunkt}</p>
                    </div>
                  );
                })}
                {leads.length === 0 && (
                  <div className="h-20 flex items-center justify-center">
                    <p className="text-[10px] text-slate-700 font-mono">Ingen leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MarketingTab: React.FC = () => {
  const brands = settingsStore.getBrands();
  const [selectedBrand, setSelectedBrand] = useState<string>(brands[0]?.id ?? 'soleada');
  const [inputMode, setInputMode] = useState<'url' | 'tekst'>('tekst');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ facebook: string; instagram: string; newsletter: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleGenerate = async () => {
    const info = inputMode === 'url'
      ? `URL: ${urlInput.trim()}\n\nHent informasjon fra denne URL-en og bruk den til å lage innholdet.`
      : textInput.trim();

    if (!info) { setError('Lim inn informasjon eller en URL før du genererer.'); return; }

    setError('');
    setLoading(true);
    setResult(null);
    try {
      const res = await gemini.generateMarketingContent(info, selectedBrand);
      setResult(res);
    } catch (err: any) {
      setError(`Feil: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const OUTPUT_CARDS: { key: 'facebook' | 'instagram' | 'newsletter'; label: string; icon: React.ReactNode; color: string; border: string; bg: string }[] = [
    { key: 'facebook',   label: 'Facebook-annonse',   icon: <Facebook size={14} />,  color: 'text-blue-400',   border: 'border-blue-500/25',   bg: 'bg-blue-500/5' },
    { key: 'instagram',  label: 'Instagram-post',     icon: <Instagram size={14} />, color: 'text-pink-400',   border: 'border-pink-500/25',   bg: 'bg-pink-500/5' },
    { key: 'newsletter', label: 'Nyhetsbrev-tekst',   icon: <Newspaper size={14} />, color: 'text-amber-400',  border: 'border-amber-500/25',  bg: 'bg-amber-500/5' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Overskrift ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20">
          <Sparkles size={20} className="text-fuchsia-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">AI Innholdsgenerator</h2>
          <p className="text-xs text-slate-500 mt-0.5">Lim inn produktinfo eller en bolig-URL — AI lager Facebook-annonse, Instagram-post og nyhetsbrev automatisk.</p>
        </div>
      </div>

      {/* ── Merkevare-velger ──────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-slate-800 p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Merkevare / nettside</p>
        <div className="flex flex-wrap gap-2">
          {brands.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBrand(b.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedBrand === b.id ? 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-300' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'}`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Input-seksjon ─────────────────────────────────────────────── */}
      <div className="glass rounded-2xl border border-slate-800 overflow-hidden">
        {/* Modus-tabs */}
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setInputMode('tekst')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all ${inputMode === 'tekst' ? 'bg-slate-800/60 text-white border-b-2 border-fuchsia-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FileText size={12} /> Lim inn tekst / produktinfo
          </button>
          <button
            onClick={() => setInputMode('url')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all ${inputMode === 'url' ? 'bg-slate-800/60 text-white border-b-2 border-fuchsia-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Link2 size={12} /> Lim inn URL
          </button>
        </div>

        {/* Input-felt */}
        <div className="p-4">
          {inputMode === 'tekst' ? (
            <textarea
              className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-700 resize-none focus:outline-none leading-relaxed"
              rows={7}
              placeholder={`Lim inn boligbeskrivelse, produktinfo, pris, antall rom, beliggenhet osv.\n\nEksempel:\nLuksus villa i Moraira, 4 soverom, 3 bad, privat pool, panoramautsikt over Middelhavet, 580 kvm, pris €1.250.000. Nyoppusset kjøkken, gulvvarme, garasje for 2 biler, nær strand og sentrum.`}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-slate-950/60 rounded-xl px-4 py-3 border border-slate-800 focus-within:border-fuchsia-500/40 transition-all">
                <Globe size={14} className="text-slate-600 flex-shrink-0" />
                <input
                  className="flex-1 bg-transparent text-sm text-slate-300 placeholder-slate-700 focus:outline-none"
                  placeholder="https://soleada.no/eiendom/villa-moraira-123"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                />
              </div>
              <p className="text-[10px] text-slate-700 px-1">AI bruker URL-adressen som kontekst for å generere innholdet. Lim gjerne inn ekstra info nedenfor:</p>
              <textarea
                className="w-full bg-transparent text-sm text-slate-300 placeholder-slate-700 resize-none focus:outline-none leading-relaxed"
                rows={3}
                placeholder="Valgfri tilleggsinformasjon om eiendommen…"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Generer-knapp */}
        <div className="px-4 pb-4 flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2.5 px-7 py-3 rounded-xl text-sm font-bold bg-fuchsia-500 text-white hover:bg-fuchsia-400 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-fuchsia-500/20"
          >
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Genererer innhold…</>
              : <><Sparkles size={15} /> Generer</>
            }
          </button>
          {result && !loading && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 size={11} /> Ferdig generert
            </span>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* ── Lastindikator ─────────────────────────────────────────────── */}
      {loading && (
        <div className="glass rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-8 flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-fuchsia-400" />
          <div className="text-center">
            <p className="text-sm font-bold text-fuchsia-300">AI skriver innholdet ditt…</p>
            <p className="text-xs text-slate-500 mt-1">Lager Facebook-annonse, Instagram-post og nyhetsbrev</p>
          </div>
          <div className="flex gap-6 text-[10px] text-slate-600 font-mono">
            <span className="flex items-center gap-1"><Facebook size={9} /> Facebook</span>
            <span className="flex items-center gap-1"><Instagram size={9} /> Instagram</span>
            <span className="flex items-center gap-1"><Newspaper size={9} /> Nyhetsbrev</span>
          </div>
        </div>
      )}

      {/* ── Resultater ────────────────────────────────────────────────── */}
      {result && !loading && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2">Generert innhold</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {OUTPUT_CARDS.map(card => (
            <div key={card.key} className={`rounded-2xl border ${card.border} ${card.bg} overflow-hidden`}>
              {/* Kortets header */}
              <div className={`flex items-center justify-between px-5 py-3 border-b ${card.border}`}>
                <div className={`flex items-center gap-2 font-bold text-sm ${card.color}`}>
                  {card.icon} {card.label}
                </div>
                <button
                  onClick={() => handleCopy(card.key, result[card.key])}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-white transition-all"
                >
                  {copied === card.key
                    ? <><Check size={10} className="text-emerald-400" /> Kopiert!</>
                    : <><Copy size={10} /> Kopier</>
                  }
                </button>
              </div>

              {/* Tekstboks (redigerbar) */}
              <textarea
                className={`w-full bg-transparent px-5 py-4 text-sm text-slate-300 leading-relaxed resize-none focus:outline-none`}
                rows={card.key === 'newsletter' ? 12 : card.key === 'facebook' ? 8 : 7}
                value={result[card.key]}
                onChange={e => setResult(prev => prev ? { ...prev, [card.key]: e.target.value } : prev)}
              />
            </div>
          ))}

          {/* Regenerer */}
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-all mx-auto"
          >
            <RefreshCw size={11} /> Generer på nytt
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Hoved-komponent ──────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
  { id: 'oversikt',  label: 'Oversikt',        icon: <LayoutDashboard size={15} /> },
  { id: 'innboks',   label: 'Felles Innboks',  icon: <Inbox size={15} />, badge: 4 },
  { id: 'crm',       label: 'CRM & Salg',      icon: <Users size={15} /> },
  { id: 'marketing', label: 'AI Markedsføring',icon: <Megaphone size={15} /> },
];

const BusinessHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('oversikt');
  const [headerLeads, setHeaderLeads] = useState<InboxLead[]>([]);

  useEffect(() => {
    leadStore.getLeads().then(leads => setHeaderLeads(leads.map(leadToInboxLead)));
    return leadStore.subscribe(() =>
      leadStore.getLeads().then(leads => setHeaderLeads(leads.map(leadToInboxLead)))
    );
  }, []);

  const newHeaderLeads = headerLeads.filter(l => l.isNew).slice(0, 2);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-20">

      {/* Header */}
      <header className="px-1 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Flame size={16} className="text-cyan-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold neon-text text-cyan-400">Business Hub</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Sentralisert oversikt · {Object.keys(SOURCE_CONFIG).length} nettsider · {headerLeads.length} aktive leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {newHeaderLeads.map(l => (
            <div key={l.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold text-cyan-400">Ny fra {SOURCE_CONFIG[l.kilde].shortLabel}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Tab-navigasjon */}
      <div className="flex gap-1 p-1 bg-slate-900/50 rounded-2xl border border-slate-800 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab-innhold */}
      <div>
        {activeTab === 'oversikt'  && <OversiktTab />}
        {activeTab === 'innboks'   && <InnboksTab />}
        {activeTab === 'crm'       && <CrmTab />}
        {activeTab === 'marketing' && <MarketingTab />}
      </div>
    </div>
  );
};

export default BusinessHub;
