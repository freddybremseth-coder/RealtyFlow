
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { gemini } from '../services/claudeService';
import { marketStore } from '../services/marketService';
import { settingsStore } from '../services/settingsService';
import { 
  MapPin, Search, Globe, ExternalLink, Info, TrendingUp, 
  Building, AlertCircle, BarChart3, ChevronRight, 
  Calculator, Loader2, X, FileText, Download, Copy, Check,
  Sparkles, Save, Clock, Calendar, History, Trash2, Send, Rocket, RefreshCw, Table,
  Settings as SettingsIcon, ToggleLeft, ToggleRight, Building2, UserCircle, RotateCcw
} from 'lucide-react';
import { MarketTheme, MarketAnalysis, MarketSchedule, Brand, AdvisorProfile } from '../types';
import { useNavigate } from 'react-router-dom';
import { BRANDS } from '../constants';

const MarketPulse: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('Costa Blanca, Spain');
  const [analysis, setAnalysis] = useState<{ text: string; sources: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeResearchTopic, setActiveResearchTopic] = useState<MarketTheme | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<MarketAnalysis[]>(marketStore.getAnalyses());
  const [schedule, setSchedule] = useState<MarketSchedule>(marketStore.getSchedule());
  
  // Save Modal States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveTheme, setSaveTheme] = useState<MarketTheme>(MarketTheme.GENERAL);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  const [selectedBrandId, setSelectedBrandId] = useState('soleada');
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  
  const activeBrand = useMemo(() => settingsStore.getBrand(selectedBrandId), [selectedBrandId]);

  const [roiReport, setRoiReport] = useState<string | null>(null);
  const [isGeneratingROI, setIsGeneratingROI] = useState(false);
  const [copied, setCopied] = useState(false);

  const [calcData, setCalcData] = useState({ price: 450000, rent: 2200, expenses: 400 });

  useEffect(() => {
    const unsubMarket = marketStore.subscribe(() => {
      setSavedAnalyses(marketStore.getAnalyses());
      setSchedule(marketStore.getSchedule());
    });
    const unsubSettings = settingsStore.subscribe(() => {
      setProfile(settingsStore.getProfile());
    });
    return () => {
      unsubMarket();
      unsubSettings();
    };
  }, []);

  const handleSearch = async (theme: MarketTheme = MarketTheme.GENERAL) => {
    setIsLoading(true);
    setActiveResearchTopic(theme === MarketTheme.GENERAL ? null : theme);
    try {
      const result = await gemini.getMarketPulse(location, theme, activeBrand, profile);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
      alert('Feil ved henting av data.');
    } finally {
      setIsLoading(false);
    }
  };

  const openSaveDialog = () => {
    if (!analysis) return;
    
    const themeLabel = activeResearchTopic ? activeResearchTopic.toUpperCase() : 'Generell';
    const defaultTitle = `Rapport: ${themeLabel} - ${location}`;
    
    setSaveTitle(defaultTitle);
    setSaveTheme(activeResearchTopic || MarketTheme.GENERAL);
    setIsSaveModalOpen(true);
  };

  const confirmSaveAnalysis = () => {
    if (!analysis) return;
    
    const newAnalysis: MarketAnalysis = {
      id: `ma-${Date.now()}`,
      date: new Date().toLocaleDateString('nb-NO'),
      location: location,
      theme: saveTheme,
      title: saveTitle || `Analyse ${location}`,
      text: analysis.text,
      sources: analysis.sources || []
    };

    const success = marketStore.saveAnalysis(newAnalysis);
    if (success) {
      setIsSaveModalOpen(false);
      alert("Analysen er lagret i historikken din.");
    } else {
      alert("Kunne ikke lagre analysen. Lagringsplassen er full (localStorage). Prøv å slette gamle analyser.");
    }
  };

  const handleReuse = (oldAnalysis: MarketAnalysis) => {
    setAnalysis({ text: oldAnalysis.text, sources: oldAnalysis.sources });
    setLocation(oldAnalysis.location);
    setActiveResearchTopic(oldAnalysis.theme);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const yieldValue = (((calcData.rent * 12) - (calcData.expenses * 12)) / calcData.price * 100).toFixed(2);

  const handleGenerateROI = async () => {
    setIsGeneratingROI(true);
    try {
      const report = await gemini.generateROIReport({
        location,
        price: calcData.price,
        rent: calcData.rent,
        expenses: calcData.expenses,
        yield: yieldValue
      }, activeBrand, profile);
      setRoiReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingROI(false);
    }
  };

  const toggleSchedule = () => {
    marketStore.updateSchedule({ ...schedule, enabled: !schedule.enabled });
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    marketStore.updateSchedule(schedule);
    setIsScheduleModalOpen(false);
    alert("Strategi for autopilot er oppdatert.");
  };

  const brandPrimary = activeBrand?.visualStyles?.primaryColor || '#06b6d4';

  return (
    <div className="space-y-4 sm:space-y-8 animate-in slide-in-from-right-4 duration-500 pb-24">
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 h-1.5 z-[500] bg-slate-900 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-500 w-1/3 animate-progress"></div>
        </div>
      )}

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold neon-text text-cyan-400 mb-2">Mediterranean Intel</h1>
          <p className="text-sm text-slate-400">Strategisk innsikt og brand-spesifikke rapporter for Costa Blanca.</p>
        </div>
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
           <div className="flex bg-slate-950/50 p-1 rounded-xl mr-2">
              {BRANDS.map(b => (
                <button 
                  key={b.id} 
                  type="button"
                  onClick={() => setSelectedBrandId(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${selectedBrandId === b.id ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {b.name.split('.')[0]}
                </button>
              ))}
           </div>
          <div className="px-4 py-2 border-l border-slate-800 flex items-center gap-3">
             <div className={`w-2 h-2 rounded-full ${schedule.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
             <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest">
               Auto: {schedule.enabled ? 'ON' : 'OFF'}
             </span>
          </div>
          <button type="button" onClick={toggleSchedule} className={`p-3 rounded-xl transition-all ${schedule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
            <RefreshCw size={18} className={schedule.enabled ? 'animate-spin-slow' : ''} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-slate-800 shadow-2xl bg-gradient-to-br from-slate-900/50 to-transparent">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-500" size={20} />
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-[1.5rem] pl-14 pr-6 py-5 text-slate-100 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/5 transition-all"
                  placeholder="Skriv inn by eller region..."
                />
              </div>
              <button 
                type="button"
                onClick={() => handleSearch(MarketTheme.GENERAL)}
                disabled={isLoading}
                className="px-4 sm:px-10 py-3 sm:py-5 bg-cyan-500 text-slate-950 rounded-2xl sm:rounded-[1.5rem] font-bold flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all shadow-xl shadow-cyan-500/20 active:scale-95 whitespace-nowrap"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                Generer Analyse
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
               {[
                 { id: MarketTheme.PRICING, label: 'Prisutvikling', icon: <TrendingUp />, desc: 'Kvadratmeter og ROI' },
                 { id: MarketTheme.LEGAL, label: 'Juridisk Info', icon: <AlertCircle />, desc: 'Skatt, LPO & Lover' },
                 { id: MarketTheme.INFRASTRUCTURE, label: 'Infrastruktur', icon: <Building />, desc: 'Nye prosjekter' }
               ].map(theme => (
                 <button 
                   key={theme.id}
                   type="button"
                   onClick={() => handleSearch(theme.id)}
                   className={`p-6 rounded-3xl border text-left transition-all group ${activeResearchTopic === theme.id ? 'bg-cyan-500/10 border-cyan-500 shadow-lg' : 'bg-slate-950/30 border-slate-800 hover:border-slate-700'}`}
                 >
                   <div className={`mb-4 p-3 rounded-2xl w-fit ${activeResearchTopic === theme.id ? 'bg-cyan-500 text-slate-950' : 'bg-slate-900 text-slate-400 group-hover:text-cyan-400'}`}>
                     {theme.icon}
                   </div>
                   <h4 className="font-bold text-slate-100 mb-1">{theme.label}</h4>
                   <p className="text-[10px] text-slate-500 uppercase tracking-wider">{theme.desc}</p>
                 </button>
               ))}
            </div>
          </div>

          {analysis && (
            <div className="glass p-4 sm:p-10 lg:p-20 rounded-2xl sm:rounded-[4rem] border border-slate-800 relative overflow-hidden bg-white/[0.01]">
               {/* pointer-events-none added to decorative blur div to prevent blocking button clicks */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] blur-[150px] -mr-64 -mt-64 pointer-events-none" style={{ backgroundColor: `${brandPrimary}15` }}></div>
               
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-20 pb-4 sm:pb-10 border-b border-slate-800/50">
                  <div className="flex items-center gap-4 sm:gap-8">
                     <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-2 sm:p-4 flex items-center justify-center shadow-2xl flex-shrink-0">
                        {activeBrand?.logo ? <img src={activeBrand.logo} className="w-full h-full object-contain" /> : <BarChart3 size={24} className="text-cyan-400 sm:hidden" />}
                        {!activeBrand?.logo && <BarChart3 size={40} className="text-cyan-400 hidden sm:block" />}
                     </div>
                     <div>
                        <h2 className="text-lg sm:text-4xl font-bold text-white uppercase tracking-tighter leading-none mb-1 sm:mb-3">
                          {activeResearchTopic ? `Rapport: ${activeResearchTopic.toUpperCase()}` : 'Markedsanalyse'}
                        </h2>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-sm font-mono tracking-widest text-slate-500">
                           <span className="flex items-center gap-1 sm:gap-2 uppercase tracking-[0.2em]"><MapPin size={12} className="text-cyan-500" /> {location.toUpperCase()}</span>
                           <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                           <span className="flex items-center gap-1 sm:gap-2 uppercase tracking-[0.2em]">{activeBrand?.name || 'Zen Eco Homes'}</span>
                        </div>
                     </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSaveDialog()}
                    className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-2 sm:py-4 bg-slate-900 text-slate-300 rounded-xl sm:rounded-2xl border border-slate-800 text-xs font-bold uppercase hover:bg-slate-800 transition-all shadow-xl active:scale-95 z-20 flex-shrink-0"
                  >
                     <Save size={16} /> Lagre
                  </button>
               </div>

               <div className="prose prose-invert max-w-none
                prose-h1:text-2xl sm:prose-h1:text-4xl prose-h1:text-cyan-400 prose-h1:mb-6 sm:prose-h1:mb-12 prose-h1:text-center prose-h1:font-bold prose-h1:tracking-tighter prose-h1:leading-tight
                prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:text-white prose-h2:border-l-4 prose-h2:border-cyan-500 prose-h2:pl-4 prose-h2:mt-8 prose-h2:mb-4 prose-h2:font-bold prose-h2:uppercase prose-h2:tracking-tight
                prose-h3:text-lg prose-h3:text-slate-100 prose-h3:mt-6 prose-h3:mb-3 prose-h3:font-bold
                prose-table:w-full prose-table:my-6 prose-table:border-collapse prose-table:overflow-hidden prose-table:shadow-lg
                prose-th:bg-slate-900 prose-th:text-cyan-400 prose-th:p-3 prose-th:text-left prose-th:border prose-th:border-slate-800 prose-th:uppercase prose-th:text-xs prose-th:tracking-wider
                prose-td:p-3 prose-td:border prose-td:border-slate-800 prose-td:text-slate-300 prose-td:text-sm prose-td:bg-slate-950/20
                prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-base prose-p:mb-4
                prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/5 prose-blockquote:rounded-xl prose-blockquote:p-4 prose-blockquote:text-indigo-100 prose-blockquote:not-italic prose-blockquote:my-6 prose-blockquote:text-base prose-blockquote:shadow-inner
                prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 prose-pre:rounded-xl prose-pre:p-4 prose-pre:shadow-lg prose-pre:my-4 prose-pre:overflow-x-auto
                prose-code:text-cyan-400 prose-code:font-mono prose-code:text-sm
                prose-hr:border-slate-800 prose-hr:my-8 prose-hr:border-t-2
                prose-li:text-slate-300 prose-li:text-base prose-li:mb-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {analysis.text}
                  </ReactMarkdown>
               </div>

               <div className="mt-8 sm:mt-16 pt-6 sm:pt-10 border-t border-slate-800 flex flex-col md:flex-row justify-between items-end gap-6 sm:gap-12">
                  <div className="space-y-6 flex-1">
                    <h3 className="text-[12px] font-mono text-slate-600 uppercase tracking-[0.5em] flex items-center gap-4">
                       <Globe size={22} className="text-cyan-500" /> Kildegrunnlag & Markedsverifisering
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {analysis.sources?.map((s, i) => (
                         <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-slate-950 rounded-3xl border border-slate-900 hover:border-cyan-500/50 transition-all group shadow-xl">
                            <div className="truncate pr-6">
                               <p className="text-sm font-bold text-slate-200 truncate mb-1">{s.title}</p>
                               <p className="text-[10px] text-slate-600 truncate font-mono tracking-widest uppercase">{s.url}</p>
                            </div>
                            <ExternalLink size={20} className="text-slate-800 group-hover:text-cyan-400 flex-shrink-0" />
                         </a>
                       ))}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 w-full md:w-80 p-8 rounded-[2rem] border border-slate-800 bg-slate-900/40 text-center space-y-4">
                     <div className="w-20 h-20 rounded-full bg-slate-800 mx-auto overflow-hidden border-2 border-slate-700 shadow-xl">
                        {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover" /> : <UserCircle size={80} className="text-slate-600" />}
                     </div>
                     <div>
                        <p className="text-lg font-bold text-white leading-tight">{profile.name}</p>
                        <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest mt-1">Senior Rådgiver</p>
                     </div>
                     <div className="pt-4 border-t border-slate-800 text-[10px] text-slate-500 leading-relaxed italic">
                        {profile.signature?.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-slate-800 flex flex-col max-h-[400px] lg:max-h-[600px] shadow-xl">
              <h3 className="text-sm font-bold text-slate-100 mb-6 flex items-center gap-2">
                 <History size={18} className="text-indigo-400" /> Rapportarkiv
              </h3>
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                 {savedAnalyses.length > 0 ? savedAnalyses.map(sa => (
                   <div key={sa.id} className="p-5 bg-slate-900/40 border border-slate-800 rounded-3xl hover:border-cyan-500/20 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                         <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{sa.date} • {sa.location}</span>
                         <button type="button" onClick={() => marketStore.deleteAnalysis(sa.id)} className="text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 mb-5">{sa.title}</h4>
                      <div className="flex flex-wrap gap-2">
                         <button 
                           type="button"
                           onClick={() => handleReuse(sa)}
                           className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-slate-700 hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-all"
                         >
                            <RotateCcw size={14} /> Gjenbruk
                         </button>
                         <button 
                           type="button"
                           onClick={() => navigate('/growth', { state: { marketIntel: sa } })}
                           className="flex-1 py-2.5 bg-cyan-500/10 text-cyan-500 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-cyan-500/20 hover:bg-cyan-500/20 flex items-center justify-center gap-1.5 transition-all"
                         >
                            <Rocket size={14} /> Growth
                         </button>
                      </div>
                   </div>
                 )) : (
                   <div className="flex flex-col items-center justify-center h-full opacity-20 text-center py-10">
                      <FileText size={48} className="mb-4" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Ingen lagrede rapporter</p>
                   </div>
                 )}
              </div>
           </div>

           <div className="glass p-8 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 shadow-xl">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Calendar size={18} className="text-emerald-400" /> Autopilot Strategi
                 </h3>
                 <div className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${schedule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    {schedule.enabled ? 'AKTIV' : 'PAUSE'}
                 </div>
              </div>
              <div className="space-y-6">
                 <div className="p-5 bg-slate-950/50 border border-slate-800 rounded-[2rem] space-y-4">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 uppercase tracking-widest">Neste tema:</span>
                       <span className="text-cyan-400 font-bold uppercase tracking-wider">{schedule.nextTheme}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-slate-500 uppercase tracking-widest">Frekvens:</span>
                       <span className="text-white font-bold">{schedule.frequency === 'weekly' ? 'Ukentlig' : 'Månedlig'}</span>
                    </div>
                 </div>
                 <button 
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full py-4 bg-slate-800 text-slate-200 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                    <SettingsIcon size={16} /> Endre Strategi
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* SAVE ANALYSIS MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
            <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-3"><Save className="text-cyan-400" size={24} /> Lagre Analyse</h3>
              <button type="button" onClick={() => setIsSaveModalOpen(false)} className="text-slate-500 hover:text-white"><X size={28} /></button>
            </header>
            <div className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Rapporttittel</label>
                <input 
                  type="text" 
                  value={saveTitle} 
                  onChange={e => setSaveTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200 focus:border-cyan-500 outline-none"
                  placeholder="Navngi rapporten..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest ml-1">Kategori / Tema</label>
                <div className="grid grid-cols-2 gap-2">
                   {Object.values(MarketTheme).map(t => (
                     <button 
                       key={t}
                       type="button"
                       onClick={() => setSaveTheme(t)}
                       className={`p-3 rounded-xl border text-[10px] font-bold uppercase transition-all ${saveTheme === t ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                     >
                       {t}
                     </button>
                   ))}
                </div>
              </div>

              <button 
                type="button"
                onClick={() => confirmSaveAnalysis()}
                className="w-full py-5 bg-cyan-500 text-slate-950 rounded-2xl font-bold text-sm tracking-widest shadow-2xl shadow-cyan-500/20 hover:bg-cyan-400 transition-all uppercase mt-4 active:scale-95"
              >
                Bekreft Lagring
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
            <header className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-3"><SettingsIcon className="text-emerald-400" size={24} /> Autopilot Strategi</h3>
              <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="text-slate-500 hover:text-white"><X size={28} /></button>
            </header>
            <form onSubmit={handleSaveSchedule} className="p-10 space-y-8">
              <div className="flex items-center justify-between p-6 bg-slate-950 border border-slate-800 rounded-3xl">
                <span className="text-base font-bold text-slate-200">Autopilot Aktiv</span>
                <button 
                  type="button"
                  onClick={() => setSchedule({...schedule, enabled: !schedule.enabled})}
                  className="text-cyan-400"
                >
                  {schedule.enabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-slate-600" />}
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-mono text-slate-500 uppercase tracking-widest ml-1">Publiseringsfrekvens</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setSchedule({...schedule, frequency: 'weekly'})}
                    className={`p-4 rounded-2xl border text-sm font-bold transition-all ${schedule.frequency === 'weekly' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    Hver uke
                  </button>
                  <button 
                    type="button"
                    onClick={() => setSchedule({...schedule, frequency: 'monthly'})}
                    className={`p-4 rounded-2xl border text-sm font-bold transition-all ${schedule.frequency === 'monthly' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/10' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                  >
                    Månedlig
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-bold text-sm tracking-widest shadow-2xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all uppercase active:scale-95"
              >
                Oppdater Strategi
              </button>
            </form>
          </div>
        </div>
      )}

      {roiReport && (
        <div className="fixed inset-0 z-[600] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center p-4 lg:p-12 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-full max-w-6xl bg-[#08080a] border border-slate-800 rounded-[4rem] overflow-hidden flex flex-col shadow-3xl h-[90vh]">
             <header className="p-10 border-b border-slate-800 flex justify-between items-center bg-slate-900/20">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                      <FileText size={32} />
                   </div>
                   <div>
                      <h2 className="text-2xl font-bold text-white uppercase tracking-widest">Investeringsanalyse & Prospekt</h2>
                      <p className="text-xs text-slate-500 font-mono tracking-widest mt-1">{location.toUpperCase()} • Net Yield {yieldValue}% • 2026 Prognose</p>
                   </div>
                </div>
                <button type="button" onClick={() => setRoiReport(null)} className="p-4 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-full shadow-xl"><X size={28} /></button>
             </header>

             <div className="flex-1 overflow-y-auto p-12 lg:p-24 prose prose-invert max-w-none 
                prose-h1:text-5xl prose-h1:text-center prose-h1:text-cyan-400 prose-h1:mb-20 prose-h1:font-bold prose-h1:tracking-tighter
                prose-h2:text-3xl prose-h2:text-white prose-h2:border-l-8 prose-h2:border-cyan-500 prose-h2:pl-8 prose-h2:mt-32 prose-h2:mb-12
                prose-table:w-full prose-table:my-16 prose-table:border prose-table:border-slate-800 prose-th:bg-slate-900/90 prose-th:text-cyan-400 prose-th:p-6 prose-td:p-6 prose-td:border prose-td:border-slate-800 prose-td:bg-slate-950/20
                prose-p:text-slate-300 prose-p:text-xl prose-p:leading-[2] prose-p:mb-10
                prose-blockquote:border-l-8 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-500/10 prose-blockquote:rounded-[3rem] prose-blockquote:p-12 prose-blockquote:text-indigo-100 prose-blockquote:text-xl prose-blockquote:not-italic prose-blockquote:my-20
                prose-pre:bg-slate-950 prose-pre:p-10 prose-pre:rounded-[2rem] prose-pre:border prose-pre:border-slate-800 prose-pre:shadow-2xl prose-pre:my-16
                whitespace-pre-wrap font-sans custom-scrollbar">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {roiReport}
                </ReactMarkdown>
             </div>

             <footer className="p-10 border-t border-slate-800 bg-slate-900/40 flex justify-end gap-6">
                <button 
                   type="button"
                   onClick={() => {
                     navigator.clipboard.writeText(roiReport || "");
                     setCopied(true);
                     setTimeout(() => setCopied(false), 2000);
                   }}
                   className="flex items-center gap-3 px-10 py-5 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700 shadow-xl"
                >
                   {copied ? <Check size={20} /> : <Copy size={20} />}
                   {copied ? "Kopiert til utklipp" : "Kopier Analyse"}
                </button>
                <button type="button" className="flex items-center gap-3 px-12 py-5 bg-cyan-500 text-slate-950 rounded-2xl font-bold hover:bg-cyan-400 transition-all shadow-2xl shadow-cyan-500/20 uppercase tracking-widest text-xs">
                   <Download size={20} /> Last ned PDF-Prospekt
                </button>
             </footer>
          </div>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-progress {
          animation: progress 2s infinite linear;
        }
        .animate-spin-slow {
          animation: spin 8s infinite linear;
        }
        .shadow-3xl {
          box-shadow: 0 0 100px rgba(0,0,0,0.9);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
      `}</style>
    </div>
  );
};

export default MarketPulse;
