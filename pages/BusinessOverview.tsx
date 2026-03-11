
import React, { useState } from 'react';
import { gemini } from '@/services/geminiService';
import { settingsStore } from '@/services/settingsService';
import {
  Building2, Globe, Zap, Sparkles, Loader2, Copy, Check,
  TrendingUp, ShoppingBag, User, Leaf, Bot, BookOpen,
  ChevronRight, Play, RefreshCw, Mail, Phone, ExternalLink,
  BarChart3, Target, Layers
} from 'lucide-react';

const BRAND_META: Record<string, {
  color: string; bg: string; border: string; icon: React.ReactNode;
  tagline: string; aiTasks: string[];
}> = {
  soleada: {
    color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30',
    icon: <Building2 size={20} />,
    tagline: 'Luksus eiendomsmegling på Costa Blanca',
    aiTasks: ['Generer ukentlig markedsrapport', 'Skriv Facebook-annonse for ny bolig', 'Lag e-post til nye leads', 'Analyser prisutviklingen i Altea']
  },
  zeneco: {
    color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30',
    icon: <Zap size={20} />,
    tagline: 'Moderne nybygg og energieffektive hjem',
    aiTasks: ['Skriv teknisk prospekt for nybygg', 'Generer LinkedIn-innlegg om A-energirating', 'Lag kjøpsguide for nye boliger', 'Analyser Benidorm-markedet']
  },
  pinosoecolife: {
    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30',
    icon: <Leaf size={20} />,
    tagline: 'Bærekraftige fincaer og tomter i innlandet',
    aiTasks: ['Skriv blogg om økoliv i Pinoso', 'Generer Instagram-post om finca-liv', 'Lag salgsbrev til norske kjøpere', 'Skriv guide: kjøpe tomt i Spania']
  },
  chatgenius: {
    color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30',
    icon: <Bot size={20} />,
    tagline: 'AI-drevne chatbots og automatisering som SaaS',
    aiTasks: ['Skriv salgsside for chatbot-produkt', 'Generer e-postsekvens for onboarding', 'Lag LinkedIn-artikkel om AI-automatisering', 'Skriv FAQ for SaaS-produktet']
  },
  freddy: {
    color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30',
    icon: <BookOpen size={20} />,
    tagline: 'Forfatter, investor og rådgiver',
    aiTasks: ['Skriv intro til ny bok', 'Generer foredragspresentasjon', 'Lag konsulentpakke-beskrivelse', 'Skriv LinkedIN-autoritetartikkel']
  },
  donaanna: {
    color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30',
    icon: <ShoppingBag size={20} />,
    tagline: 'Premium olivenolje og bordoliven fra Spania',
    aiTasks: ['Skriv produktbeskrivelse for olivenolje', 'Generer Instagram-post om gården', 'Lag e-post til abonnenter', 'Skriv pressemelding om ny høst']
  }
};

const BusinessOverview: React.FC = () => {
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [runningTask, setRunningTask] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const handleRunTask = async (brandId: string, task: string) => {
    const key = `${brandId}::${task}`;
    setRunningTask(key);
    try {
      const result = await gemini.generateCMSContent('markedsinnhold', task, brandId);
      setResults(prev => ({ ...prev, [key]: result }));
    } catch (err: any) {
      setResults(prev => ({ ...prev, [key]: `Feil: ${err.message}` }));
    } finally {
      setRunningTask(null);
    }
  };

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const brands = settingsStore.getBrands();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="px-1">
        <div className="flex items-center gap-3 mb-2">
          <Layers className="text-cyan-400" size={32} />
          <h1 className="text-4xl font-bold neon-text text-cyan-400">Business Hub</h1>
        </div>
        <p className="text-slate-400 text-sm">Full oversikt over alle 6 merkevarer — AI utfører oppgaver på tvers av alle forretningsmodeller.</p>
      </header>

      {/* KPI stripe */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {brands.map(b => {
          const meta = BRAND_META[b.id];
          if (!meta) return null;
          return (
            <button
              key={b.id}
              onClick={() => setActiveBrand(activeBrand === b.id ? null : b.id)}
              className={`p-4 rounded-2xl border text-left transition-all group ${activeBrand === b.id ? `${meta.bg} ${meta.border}` : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
            >
              <div className={`mb-2 ${activeBrand === b.id ? meta.color : 'text-slate-600 group-hover:text-slate-400'}`}>{meta.icon}</div>
              <p className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${activeBrand === b.id ? meta.color : 'text-slate-500'}`}>{b.name}</p>
              <p className="text-[9px] text-slate-600 mt-0.5 truncate">{b.type}</p>
            </button>
          );
        })}
      </div>

      {/* Detail panel for selected brand */}
      {activeBrand && (() => {
        const meta = BRAND_META[activeBrand];
        const brandConfig = brands.find(b => b.id === activeBrand);
        if (!meta || !brandConfig) return null;
        return (
          <div className={`glass rounded-[2.5rem] border ${meta.border} p-6 sm:p-10 space-y-8 animate-in slide-in-from-top-4 duration-400`}>
            {/* Brand header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
              <div className="flex items-center gap-5">
                <div className={`p-4 rounded-2xl ${meta.bg} ${meta.color}`}>{meta.icon}</div>
                <div>
                  <h2 className={`text-2xl font-bold ${meta.color}`}>{brandConfig.name}</h2>
                  <p className="text-slate-400 text-sm mt-1">{meta.tagline}</p>
                  <p className="text-slate-500 text-xs mt-1 italic">{brandConfig.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {brandConfig.email && (
                  <a href={`mailto:${brandConfig.email}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white transition-all">
                    <Mail size={12} /> {brandConfig.email}
                  </a>
                )}
                {brandConfig.website && (
                  <a href={brandConfig.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-white transition-all">
                    <ExternalLink size={12} /> Nettside
                  </a>
                )}
              </div>
            </div>

            {/* AI Quick-Execute Tasks */}
            <div className="space-y-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Sparkles size={12} className={meta.color} /> AI-oppgaver — klikk for å kjøre
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meta.aiTasks.map(task => {
                  const key = `${activeBrand}::${task}`;
                  const isRunning = runningTask === key;
                  const result = results[key];
                  return (
                    <div key={task} className="space-y-3">
                      <button
                        onClick={() => handleRunTask(activeBrand, task)}
                        disabled={!!runningTask}
                        className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl border transition-all text-left ${meta.bg} ${meta.border} hover:opacity-80 disabled:opacity-50`}
                      >
                        <span className={`text-sm font-bold ${meta.color}`}>{task}</span>
                        {isRunning
                          ? <Loader2 size={16} className={`animate-spin ${meta.color} shrink-0`} />
                          : <Play size={14} className={`${meta.color} shrink-0`} />
                        }
                      </button>
                      {result && (
                        <div className="relative bg-slate-950/80 border border-slate-800 rounded-2xl p-5 animate-in fade-in duration-300">
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">{result}</p>
                          <button
                            onClick={() => handleCopy(key, result)}
                            className="absolute top-3 right-3 p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                          >
                            {copied === key ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      {/* All brands overview grid */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2 px-1">
          <BarChart3 size={12} className="text-cyan-400" /> Alle merkevarer — status og konfigurasjon
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {brands.map(b => {
            const meta = BRAND_META[b.id];
            const config = brands.find(br => br.id === b.id);
            if (!meta || !config) return null;
            const integrationCount = config.integrations
              ? Object.entries(config.integrations).filter(([k, v]) => k.endsWith('Active') && v).length
              : 0;
            return (
              <div key={b.id} className={`glass p-6 rounded-[2rem] border ${meta.border} bg-slate-900/30 space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.color}`}>{meta.icon}</div>
                    <div>
                      <p className={`font-bold text-sm ${meta.color}`}>{config.name}</p>
                      <p className="text-[10px] text-slate-500">{config.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveBrand(activeBrand === b.id ? null : b.id)}
                    className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-all"
                  >
                    Kjør AI <ChevronRight size={12} />
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{config.description}</p>
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-600">
                    <Target size={10} /> {config.website?.replace('https://', '')}
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-[10px]">
                    {integrationCount > 0
                      ? <span className="text-emerald-400 font-bold">{integrationCount} integrasjoner aktive</span>
                      : <span className="text-slate-600">Ingen integrasjoner satt opp</span>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BusinessOverview;
