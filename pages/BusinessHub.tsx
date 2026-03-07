import React, { useState } from 'react';
import {
  LayoutDashboard, Inbox, Users, Megaphone,
  Building2, ShoppingBag, Leaf, Bot, BookOpen, Zap,
  TrendingUp, TrendingDown, Euro, Mail, Phone,
  Clock, CheckCircle2, AlertCircle, Circle,
  Sparkles, Play, Loader2, Copy, Check,
  ArrowUpRight, MoreHorizontal, Filter, RefreshCw,
  Globe, Tag, Star, ChevronRight, BarChart3,
  MessageSquare, Send, FileText, Image, Calendar,
  Flame, Target, Award, Activity
} from 'lucide-react';
import { gemini } from '../services/claudeService';
import { settingsStore } from '../services/settingsService';

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

const OversiktTab: React.FC = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    {/* KPI-kort */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {KPI_DATA.map((kpi) => (
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
      {/* Leads per kilde */}
      <div className="lg:col-span-2 glass p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={12} className="text-cyan-400" /> Leads per nettside
        </h3>
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
          const count = MOCK_LEADS.filter(l => l.kilde === key).length;
          const pct = Math.round((count / MOCK_LEADS.length) * 100);
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cfg.color}>{cfg.icon}</span>
                  <span className="text-xs text-slate-300">{cfg.shortLabel}</span>
                  <span className="text-[9px] text-slate-600 font-mono">{cfg.type}</span>
                </div>
                <span className={`text-xs font-bold ${cfg.color}`}>{count}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: cfg.textColor }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Aktivitetsstrøm */}
      <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Activity size={12} className="text-cyan-400" /> Siste aktivitet
        </h3>
        <div className="space-y-4">
          {ACTIVITY_FEED.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${item.dot}`} />
                {i < ACTIVITY_FEED.length - 1 && <div className="w-px flex-1 bg-slate-800 mt-1" />}
              </div>
              <div className="pb-3">
                <p className="text-xs text-slate-200 font-medium">{item.text}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{item.sub}</p>
                <p className="text-[10px] text-slate-700 font-mono mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Nettside-oversikt */}
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
        <Globe size={12} className="text-cyan-400" /> Nettsider tilkoblet Business Hub
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
          <div key={key} className={`p-4 rounded-2xl border ${cfg.bg} ${cfg.border} space-y-2`}>
            <div className={`${cfg.color}`}>{cfg.icon}</div>
            <p className={`text-xs font-bold ${cfg.color}`}>{cfg.shortLabel}</p>
            <p className="text-[9px] text-slate-600 font-mono">{cfg.url}</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-emerald-400 font-mono">Live</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const InnboksTab: React.FC = () => {
  const [filter, setFilter] = useState<Source | 'alle'>('alle');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'alle'>('alle');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = MOCK_LEADS.filter(l => {
    const matchKilde = filter === 'alle' || l.kilde === filter;
    const matchStatus = statusFilter === 'alle' || l.status === statusFilter;
    return matchKilde && matchStatus;
  });

  const nyeLeads = MOCK_LEADS.filter(l => l.isNew).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header med stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-cyan-400">{nyeLeads} nye leads</span>
          </div>
          <span className="text-xs text-slate-500">{MOCK_LEADS.length} totalt</span>
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
          return (
            <div
              key={lead.id}
              className={`glass rounded-2xl border transition-all cursor-pointer ${isOpen ? `${src.border} ${src.bg}` : 'border-slate-800 hover:border-slate-700'}`}
              onClick={() => setExpanded(isOpen ? null : lead.id)}
            >
              <div className="p-4 flex items-start gap-4">
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm"
                  style={{ background: src.textColor + '18', color: src.textColor }}
                >
                  {lead.navn.charAt(0)}
                </div>

                {/* Info */}
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

                {/* Høyre side */}
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

              {/* Ekspandert visning */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-800/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-950/60 rounded-xl p-4">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2">Melding</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{lead.melding}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all">
                      <Mail size={12} /> Send e-post
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700">
                      <Phone size={12} /> Ring
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700">
                      <Sparkles size={12} /> AI-svar
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                      <CheckCircle2 size={12} /> Marker kvalifisert
                    </button>
                  </div>
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
          const leads = MOCK_LEADS.filter(l => l.status === col.status);
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
          const leads = MOCK_LEADS.filter(l => l.status === col.status);
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
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Source | 'alle'>('alle');

  const filtered = selectedBrand === 'alle' ? AI_TASKS : AI_TASKS.filter(t => t.brand === selectedBrand);

  const handleRun = async (task: AiTask) => {
    setRunning(task.id);
    try {
      const result = await gemini.generateCMSContent('markedsinnhold', task.prompt, task.brand);
      setResults(prev => ({ ...prev, [task.id]: result }));
    } catch (err: any) {
      setResults(prev => ({ ...prev, [task.id]: `Feil: ${err.message}` }));
    } finally {
      setRunning(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Kilde-filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedBrand('alle')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedBrand === 'alle' ? 'bg-slate-700 border-slate-600 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
        >
          Alle merkevarer
        </button>
        {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setSelectedBrand(key as Source)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${selectedBrand === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-700'}`}
          >
            {cfg.icon} {cfg.shortLabel}
          </button>
        ))}
      </div>

      {/* AI-oppgaver */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(task => {
          const src = SOURCE_CONFIG[task.brand];
          const isRunning = running === task.id;
          const result = results[task.id];
          return (
            <div key={task.id} className="space-y-3">
              <div className={`glass p-5 rounded-2xl border ${src.border} space-y-3`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl ${src.bg} ${src.color} mt-0.5`}>{src.icon}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-200">{task.label}</p>
                      <SourceTag source={task.brand} />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRun(task)}
                    disabled={!!running}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${isRunning ? 'bg-slate-800 text-slate-500' : `${src.bg} ${src.color} border ${src.border} hover:opacity-80`} disabled:opacity-50`}
                  >
                    {isRunning
                      ? <><Loader2 size={12} className="animate-spin" /> Kjører…</>
                      : <><Sparkles size={12} /> Kjør AI</>
                    }
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed line-clamp-2 italic">"{task.prompt.substring(0, 100)}…"</p>
              </div>

              {result && (
                <div className="relative bg-slate-950/80 border border-slate-800 rounded-2xl p-5 animate-in fade-in duration-300">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto pr-6">{result}</p>
                  <button
                    onClick={() => handleCopy(task.id, result)}
                    className="absolute top-3 right-3 p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                  >
                    {copied === task.id ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
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
            Sentralisert oversikt · {Object.keys(SOURCE_CONFIG).length} nettsider · {MOCK_LEADS.length} aktive leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          {MOCK_LEADS.filter(l => l.isNew).map(l => (
            <div key={l.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-bold text-cyan-400">Ny fra {SOURCE_CONFIG[l.kilde].shortLabel}</span>
            </div>
          )).slice(0, 2)}
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
