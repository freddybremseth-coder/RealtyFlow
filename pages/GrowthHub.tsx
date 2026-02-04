
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { gemini } from '../services/geminiService';
import { marketStore } from '../services/marketService';
import { propertyStore } from '../services/propertyService';
import { settingsStore } from '../services/settingsService';
import { campaignStore, MarketingCampaign } from '../services/campaignService';
import { BRANDS } from '../constants';
import { 
   Rocket, Share2, Target, Zap, Instagram, Facebook, 
   Youtube, Twitter, Mail, Copy, Check, RefreshCw, 
   Sparkles, FileText, BarChart3, ChevronRight, MessageCircle,
   PlayCircle, Magnet, MousePointer2, Plus, Linkedin,
   Settings, Clock, ShieldCheck, ToggleLeft, ToggleRight, 
   Eye, Save, AlertCircle, Heart, Repeat, MessageSquare, TrendingUp,
  X, Calendar, Gauge, Info, Filter, Clock8, MousePointerClick, Loader2,
  Gift, Bot, ShieldAlert, Workflow, MonitorPlay, Building2, Quote,
  Library, Upload, Trash2, Home, Paperclip, FileCheck, Wand2, Download, Image as ImageIcon,
  CheckCircle2, Send, Activity, Users, MousePointer, DollarSign, BarChart, Map, Edit3, Archive
} from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MarketAnalysis, Property, Brand, AutomationSettings } from '../types';

const BRAND_TEMPLATES: Record<string, string> = {
  soleada: 'Fokuser på luksus, havutsikt i Altea Hills og en eksklusiv internasjonal livsstil.',
  zeneco: 'Fokuser på moderne teknologi, energieffektivitet (A-rating) og minimalistisk design i Benidorm, Costa Blanca og Costa Calida.',
  pinoso: 'Fokuser på bærekraftig livsstil, ro, natur, fellesskap og økologiske fincas i Biar og Pinoso.'
};

const ANALYTICS_DATA = [
  { name: 'Man', clicks: 400, leads: 24, conversion: 6 },
  { name: 'Tir', clicks: 300, leads: 13, conversion: 4 },
  { name: 'Ons', clicks: 200, leads: 98, conversion: 49 },
  { name: 'Tor', clicks: 278, leads: 39, conversion: 14 },
  { name: 'Fre', clicks: 189, leads: 48, conversion: 25 },
  { name: 'Lør', clicks: 239, leads: 38, conversion: 15 },
  { name: 'Søn', clicks: 349, leads: 43, conversion: 12 },
];

const GrowthHub: React.FC = () => {
  const location = useLocation();
  const [selectedBrandId, setSelectedBrandId] = useState('soleada');
  const [activeTab, setActiveTab] = useState<'ads' | 'automation' | 'stats' | 'guide' | 'library'>('ads');
  const [isGenerating, setIsGenerating] = useState(false);
  const [adResult, setAdResult] = useState<any>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [objective, setObjective] = useState(BRAND_TEMPLATES['soleada']);
  const [brandData, setBrandData] = useState(settingsStore.getBrand('soleada'));
  const [automation, setAutomation] = useState<AutomationSettings>(settingsStore.getAutomation());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Zen Eco Guide State
  const [zenGuide, setZenGuide] = useState<string | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  // Image Generation States
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<"1:1" | "16:9" | "9:16">("16:9");
  const [imageError, setImageError] = useState<string | null>(null);
  const [showEditMode, setShowEditMode] = useState(false);
  const [editInstruction, setEditInstruction] = useState('');

  // Publishing & Saving State
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedCampaigns, setSavedCampaigns] = useState<MarketingCampaign[]>(campaignStore.getCampaigns());

  // Context States
  const [marketAnalyses, setMarketAnalyses] = useState<MarketAnalysis[]>(marketStore.getAnalyses());
  const [properties, setProperties] = useState<Property[]>(propertyStore.getProperties());
  const [selectedContextAssets, setSelectedContextAssets] = useState<any[]>([]);
  
  useEffect(() => {
    if (location.state?.marketIntel) {
      addAssetToContext({ type: 'market', data: location.state.marketIntel });
    }
  }, [location.state]);

  useEffect(() => {
    const brand = settingsStore.getBrand(selectedBrandId);
    setBrandData(brand);
    if (selectedContextAssets.length === 0) {
      setObjective(BRAND_TEMPLATES[selectedBrandId] || 'Skap lyst på boligdrømmen i Spania.');
    }
  }, [selectedBrandId]);

  useEffect(() => {
    const unsub = settingsStore.subscribe(() => {
      setBrandData(settingsStore.getBrand(selectedBrandId));
      setAutomation(settingsStore.getAutomation());
    });
    const unsubMarket = marketStore.subscribe(() => setMarketAnalyses(marketStore.getAnalyses()));
    const unsubProps = propertyStore.subscribe(() => setProperties(propertyStore.getProperties()));
    const unsubCampaigns = campaignStore.subscribe(() => setSavedCampaigns(campaignStore.getCampaigns()));
    
    return () => {
      unsub();
      unsubMarket();
      unsubProps();
      unsubCampaigns();
    };
  }, [selectedBrandId]);

  const addAssetToContext = (asset: { type: 'market' | 'property' | 'file', data: any }) => {
    if (selectedContextAssets.find(a => a.data.id === asset.data.id)) return;
    setSelectedContextAssets(prev => [...prev, asset]);
    
    let contextText = "";
    if (asset.type === 'market') contextText = `Basert på analyse: ${asset.data.title}`;
    if (asset.type === 'property') contextText = `Fokuser på bolig: ${asset.data.title} (Ref: ${asset.data.external_id})`;
    
    setObjective(prev => `${contextText}\n${prev}`);
    if (asset.type === 'property') setImagePrompt(`Luxury real estate: ${asset.data.title}`);
  };

  const handleGenerateAd = async () => {
    setIsGenerating(true);
    setAdResult(null);
    setSelectedHeadline(null);
    setImageError(null);
    setErrorMsg(null);
    setGeneratedImage(null);
    try {
      const result = await gemini.generateViralAd(selectedBrandId, objective, 'Facebook/Instagram');
      setAdResult(result);
      if (result.headlines?.[0]) {
        setImagePrompt(result.headlines[0]);
        setSelectedHeadline(result.headlines[0]);
      }
    } catch (err: any) { 
      console.error(err);
      setErrorMsg("Feil under generering av kampanje.");
    } finally { 
      setIsGenerating(false); 
    }
  };

  const handleGenerateVisual = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      const url = await gemini.generateMarketingImage(imagePrompt, imageAspectRatio);
      setGeneratedImage(url);
      setShowEditMode(false);
    } catch (err: any) {
      console.error(err);
      setImageError(err.message || "Bildegenerering feilet.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleEditVisual = async () => {
    if (!editInstruction || !generatedImage) return;
    setIsGeneratingImage(true);
    setImageError(null);
    try {
      // Use existing image as base for editing with gemini-2.5-flash-image
      const url = await gemini.generateMarketingImage(editInstruction, imageAspectRatio, generatedImage);
      setGeneratedImage(url);
      setEditInstruction('');
      setShowEditMode(false);
    } catch (err: any) {
      console.error(err);
      setImageError("Redigering feilet. Prøv en annen instruks.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSaveCampaign = () => {
    if (!adResult || !selectedHeadline) return;
    setIsSaving(true);
    try {
      const campaign: MarketingCampaign = {
        id: `cp-${Date.now()}`,
        date: new Date().toLocaleDateString('nb-NO'),
        brandId: selectedBrandId,
        headline: selectedHeadline,
        body: adResult.bodyOptions[0],
        imageUrl: generatedImage,
        objective: objective
      };
      campaignStore.saveCampaign(campaign);
      alert("Kampanjen er lagret i ditt bibliotek for videre bruk!");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!brandData?.integrations?.facebookActive) {
      alert("Facebook-integrasjon er ikke aktiv. Gå til Settings for å aktivere den.");
      return;
    }
    setIsPublishing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert("Kampanje publisert til Facebook Ads Manager!");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleAutomation = (key: keyof AutomationSettings) => {
    const updated = { ...automation, [key]: !automation[key] };
    settingsStore.updateAutomation(updated);
  };

  const handleGenerateGuide = async () => {
    setIsGeneratingGuide(true);
    setActiveTab('guide');
    try {
      const res = await gemini.generateZenEcoGuide(selectedBrandId);
      setZenGuide(res);
    } catch (e) {
      alert("Feil ved generering av kjøperguide.");
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in slide-in-from-right-4 duration-500 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 px-1">
        <div>
          <h1 className="text-4xl font-bold neon-text text-cyan-400 mb-2">Growth Hub</h1>
          <p className="text-slate-400">Strategisk vekst drevet av AI og brand-identitet.</p>
        </div>
        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto no-scrollbar">
          {[
            { id: 'ads', label: 'Viral Engine' },
            { id: 'automation', label: 'Autopilot' },
            { id: 'stats', label: 'Analytics' },
            { id: 'guide', label: 'Zen Eco Guide' },
            { id: 'library', label: 'Library' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap ${
                activeTab === t.id ? 'bg-cyan-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SIDEBAR */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass p-8 rounded-[3rem] border border-slate-800 space-y-8 shadow-2xl">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Aktivt Brand</label>
              <div className="grid grid-cols-1 gap-2">
                {BRANDS.map(b => (
                  <button 
                    key={b.id}
                    onClick={() => setSelectedBrandId(b.id)}
                    className={`p-4 rounded-2xl border flex items-center justify-between font-bold text-sm transition-all ${selectedBrandId === b.id ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                          {settingsStore.getBrand(b.id)?.logo ? <img src={settingsStore.getBrand(b.id)?.logo} className="w-full h-full object-contain" /> : <Building2 size={16} />}
                       </div>
                       {b.name}
                    </div>
                    {selectedBrandId === b.id && <Zap size={14} className="animate-pulse" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                 <Library size={12} /> Context Library
              </label>
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                 {marketAnalyses.slice(0, 5).map(ma => (
                    <button key={ma.id} onClick={() => addAssetToContext({ type: 'market', data: ma })} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-cyan-500/30 transition-all text-[10px] font-bold text-slate-300 truncate group flex items-center gap-2">
                       <Map size={12} className="text-slate-600 group-hover:text-cyan-400 flex-shrink-0" />
                       <span className="group-hover:text-cyan-400 truncate">{ma.title}</span>
                    </button>
                 ))}
                 {properties.slice(0, 5).map(p => (
                    <button key={p.id} onClick={() => addAssetToContext({ type: 'property', data: p })} className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-indigo-500/30 transition-all text-[10px] font-bold text-slate-300 truncate group flex items-center gap-2">
                       <Home size={12} className="text-slate-600 group-hover:text-indigo-400 flex-shrink-0" />
                       <span className="group-hover:text-indigo-400 truncate">{p.title}</span>
                    </button>
                 ))}
              </div>
            </div>

            {/* Added trigger for Zen Eco Guide based on user copywriting instructions */}
            <div className="pt-4 border-t border-slate-800">
               <button 
                  onClick={handleGenerateGuide}
                  disabled={isGeneratingGuide}
                  className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all shadow-lg"
               >
                  {isGeneratingGuide ? <Loader2 className="animate-spin" size={18} /> : <FileCheck size={18} />}
                  Generer Zen Eco Guide
               </button>
            </div>
            
            <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-[2rem] space-y-3">
               <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Autopilot Sync</h4>
               <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2"><Facebook size={12}/> FB Business</span>
                  {brandData?.integrations?.facebookActive ? <CheckCircle2 size={12} className="text-emerald-500" /> : <X size={12} className="text-red-500" />}
               </div>
               <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-2"><Linkedin size={12}/> LinkedIn API</span>
                  {brandData?.integrations?.facebookActive ? <CheckCircle2 size={12} className="text-emerald-500" /> : <X size={12} className="text-red-500" />}
               </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-8 space-y-8">
           {activeTab === 'ads' && (
             <div className="space-y-8">
                <div className="glass p-10 rounded-[3rem] border border-slate-800 bg-gradient-to-br from-slate-900/50 to-transparent shadow-2xl space-y-6">
                   <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-3"><Sparkles className="text-cyan-400" size={24} /> Kampanjestrategi</h3>
                      <button onClick={() => setObjective(BRAND_TEMPLATES[selectedBrandId])} className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-2"><RefreshCw size={12} /> Reset</button>
                   </div>
                   <textarea 
                     value={objective}
                     onChange={(e) => setObjective(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-800 rounded-[2rem] p-8 text-lg text-slate-200 min-h-[150px] outline-none focus:border-cyan-500 transition-all"
                     placeholder="Skriv din brief her..."
                   />
                   <div className="flex justify-end">
                      <button 
                        onClick={handleGenerateAd}
                        disabled={isGenerating}
                        className="px-12 py-5 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center gap-3 hover:bg-cyan-400 shadow-2xl shadow-cyan-500/30"
                      >
                        {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <MonitorPlay size={24} />}
                        {isGenerating ? 'Tenker...' : 'Lag Kampanje'}
                      </button>
                   </div>
                </div>

                {adResult && (
                  <div className="animate-in slide-in-from-bottom-6 duration-700 space-y-8">
                    <div className="glass p-12 rounded-[4rem] border border-slate-800 bg-[#0a0a0c] relative overflow-hidden shadow-3xl">
                       <div className="flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
                          <h3 className="text-2xl font-bold text-white">AI Kampanjeforslag</h3>
                          <div className="text-right"><div className="text-2xl font-bold text-emerald-400">Viral Impact {adResult.viralityScore}%</div></div>
                       </div>
                       <div className="space-y-12">
                          <div className="space-y-4">
                             <label className="text-[11px] font-mono text-slate-600 uppercase tracking-widest block">Velg Overskrift</label>
                             <div className="grid grid-cols-1 gap-3">
                                {adResult.headlines?.map((h: string, i: number) => (
                                  <button 
                                    key={i} 
                                    onClick={() => { setSelectedHeadline(h); setImagePrompt(h); }}
                                    className={`w-full p-6 border rounded-3xl text-left text-xl font-bold transition-all flex justify-between items-center group ${selectedHeadline === h ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-lg shadow-cyan-500/5' : 'bg-slate-950 border-slate-900 text-slate-400 hover:border-slate-700'}`}
                                  >
                                     <span className="flex-1 pr-4">{h}</span>
                                     {selectedHeadline === h ? <CheckCircle2 size={24} className="flex-shrink-0" /> : <div className="w-6 h-6 rounded-full border border-slate-800 group-hover:border-slate-700 flex-shrink-0" />}
                                  </button>
                                ))}
                             </div>
                          </div>
                          <div className="space-y-4">
                             <label className="text-[11px] font-mono text-slate-600 uppercase tracking-widest block">Annonsetekst</label>
                             <div className="p-10 bg-slate-950 border border-slate-800 rounded-[3rem] text-xl text-slate-300 italic whitespace-pre-wrap leading-relaxed relative group">
                                {adResult.bodyOptions?.[0]}
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="glass p-12 rounded-[4rem] border border-slate-800 space-y-8">
                       <h3 className="text-xl font-bold text-white flex items-center gap-3"><ImageIcon className="text-indigo-400" size={24} /> Creative Lab</h3>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <div className="space-y-6">
                             {/* GENERATE NEW IMAGE */}
                             {!generatedImage && (
                               <div className="space-y-6">
                                  <label className="text-[11px] font-mono text-slate-600 uppercase tracking-widest block">Bilde Prompt</label>
                                  <textarea 
                                      value={imagePrompt} 
                                      onChange={(e) => setImagePrompt(e.target.value)} 
                                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-6 text-sm text-slate-200 min-h-[120px] focus:border-indigo-500 outline-none transition-all" 
                                  />
                                  <button onClick={handleGenerateVisual} disabled={isGeneratingImage} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20 transition-all">
                                      {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Wand2 />} 
                                      Generer Kampanje-bilde
                                  </button>
                               </div>
                             )}

                             {/* EDIT EXISTING IMAGE */}
                             {generatedImage && (
                               <div className="space-y-6 animate-in fade-in">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[11px] font-mono text-indigo-400 uppercase tracking-widest block">Rediger Visuals</label>
                                    <button onClick={() => setGeneratedImage(null)} className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-bold">Start på nytt</button>
                                  </div>
                                  <textarea 
                                      value={editInstruction} 
                                      onChange={(e) => setEditInstruction(e.target.value)} 
                                      placeholder="Skriv instruks for endringer, f.eks. 'Legg til mer sollys', 'Gjør huset mer moderne', 'Endre himmelen til solnedgang'..."
                                      className="w-full bg-slate-950 border border-indigo-500/30 rounded-2xl p-6 text-sm text-slate-200 min-h-[120px] focus:border-indigo-500 outline-none transition-all" 
                                  />
                                  <button onClick={handleEditVisual} disabled={isGeneratingImage || !editInstruction} className="w-full py-5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-500/30 transition-all">
                                      {isGeneratingImage ? <Loader2 className="animate-spin" /> : <Edit3 size={18} />} 
                                      Utfør endringer på bilde
                                  </button>
                               </div>
                             )}
                          </div>

                          <div className="bg-slate-950/50 rounded-[2.5rem] border border-slate-800 overflow-hidden flex items-center justify-center min-h-[350px] relative group shadow-inner">
                             {generatedImage ? (
                               <>
                                 <img src={generatedImage} className="w-full h-full object-cover animate-in zoom-in-95 duration-700" />
                               </>
                             ) : (
                               <div className="text-center space-y-4">
                                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
                                    <ImageIcon className="text-slate-700" size={32} />
                                  </div>
                                  <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">{isGeneratingImage ? 'Syntetiserer...' : 'Venter på bilde-generering'}</p>
                               </div>
                             )}
                          </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button 
                          onClick={handleSaveCampaign}
                          disabled={isSaving || !generatedImage || !selectedHeadline}
                          className="w-full py-5 bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                            Lagre i bibliotek for gjenbruk
                        </button>
                        <button 
                          onClick={handlePublish}
                          disabled={isPublishing || !generatedImage || !selectedHeadline}
                          className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-400 shadow-2xl shadow-emerald-500/30 transition-all active:scale-95"
                        >
                            {isPublishing ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                            Launch Campaign Now
                        </button>
                    </div>
                  </div>
                )}
             </div>
           )}

           {activeTab === 'library' && (
             <div className="space-y-8 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                   <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Archive className="text-cyan-400" /> Kampanjebibliotek</h2>
                   <p className="text-xs text-slate-500 font-mono uppercase">{savedCampaigns.length} arkiverte kampanjer</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {savedCampaigns.length === 0 ? (
                     <div className="col-span-full py-20 bg-slate-900/20 border border-slate-800 border-dashed rounded-[3rem] text-center opacity-20">
                        <Archive size={64} className="mx-auto mb-4" />
                        <p className="text-sm font-mono uppercase">Ingen lagrede kampanjer ennå.</p>
                     </div>
                   ) : (
                     savedCampaigns.map(camp => (
                       <div key={camp.id} className="glass rounded-[2.5rem] border border-slate-800 overflow-hidden group hover:border-cyan-500/30 transition-all flex flex-col">
                          <div className="relative h-48 overflow-hidden bg-slate-900">
                             {camp.imageUrl && <img src={camp.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                             <div className="absolute top-4 left-4 bg-slate-950/80 px-3 py-1 rounded-full text-[9px] font-mono text-cyan-400 border border-cyan-500/20">{camp.brandId}</div>
                          </div>
                          <div className="p-6 space-y-4 flex-1">
                             <h4 className="font-bold text-slate-100 text-lg leading-tight line-clamp-2">{camp.headline}</h4>
                             <p className="text-xs text-slate-500 line-clamp-3 italic leading-relaxed">"{camp.body}"</p>
                          </div>
                          <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex gap-2">
                             <button onClick={() => campaignStore.deleteCampaign(camp.id)} className="p-3 text-slate-700 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                             <button onClick={() => { 
                                setSelectedHeadline(camp.headline);
                                setAdResult({ bodyOptions: [camp.body], headlines: [camp.headline], viralityScore: 90 });
                                setGeneratedImage(camp.imageUrl);
                                setObjective(camp.objective);
                                setActiveTab('ads');
                              }} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all">Gjenbruk utkast</button>
                             <button className="p-3 text-cyan-500 bg-cyan-500/10 rounded-xl hover:bg-cyan-500/20 transition-all"><Copy size={16} /></button>
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>
           )}

           {activeTab === 'automation' && (
             <div className="glass p-12 rounded-[3rem] border border-slate-800 animate-in fade-in space-y-8">
                <div className="flex items-center gap-6 p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem]">
                   <ShieldCheck className="text-emerald-400" size={40} />
                   <div><h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest">Sentinel Autopilot v2.5</h3><p className="text-slate-500 text-sm mt-1">Automatisk drift av dine markedsføringskanaler.</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {[
                     { id: 'marketPulseEnabled', title: 'Automated Market Pulse', desc: 'Ukentlige markedsrapporter.' },
                     { id: 'brandIdentityGuardEnabled', title: 'Brand Identity Guard', desc: 'Sikrer korrekt tone of voice.' },
                     { id: 'socialSyncEnabled', title: 'Social Sync', desc: 'Synkroniserer mot FB/IG/LinkedIn.' },
                     { id: 'leadNurtureEnabled', title: 'Lead Nurture AI', desc: 'Smart oppfølging av leads.' }
                   ].map((sys) => (
                     <div key={sys.id} className="p-6 bg-slate-950/50 border border-slate-800 rounded-3xl flex justify-between items-center hover:border-cyan-500/20 transition-all">
                        <div className="flex-1 pr-4"><h4 className="font-bold text-slate-200">{sys.title}</h4><p className="text-xs text-slate-500 mt-1">{sys.desc}</p></div>
                        <button 
                          onClick={() => toggleAutomation(sys.id as any)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${automation[sys.id as keyof AutomationSettings] ? 'bg-cyan-500' : 'bg-slate-800'}`}
                        >
                           <div className={`w-4 h-4 bg-white rounded-full transition-transform ${automation[sys.id as keyof AutomationSettings] ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                     </div>
                   ))}
                </div>
             </div>
           )}

           {activeTab === 'stats' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                   {[
                     { label: 'Kampanje Klikk', val: '2 842', icon: <MousePointer className="text-cyan-400" />, change: '+12%' },
                     { label: 'Nye Leads', val: '148', icon: <Users className="text-emerald-400" />, change: '+5.4%' },
                     { label: 'Konvertering', val: '5.2%', icon: <Activity className="text-indigo-400" />, change: '+0.8%' }
                   ].map((stat, i) => (
                     <div key={i} className="glass p-8 rounded-[2.5rem] border border-slate-800 space-y-4 hover:border-cyan-500/30 transition-all">
                        <div className="flex justify-between items-start">
                           <div className="p-3 bg-slate-900 rounded-xl">{stat.icon}</div>
                           <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">{stat.change}</span>
                        </div>
                        <p className="text-xs text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white font-mono">{stat.val}</h3>
                     </div>
                   ))}
                </div>

                <div className="glass p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                   <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><TrendingUp className="text-cyan-400" /> Performance History</h3>
                   <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <ReBarChart data={ANALYTICS_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                            <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                               {ANALYTICS_DATA.map((entry, index) => (
                                 <Cell key={`cell-${index}`} fill={index === 2 ? '#06b6d4' : '#1e293b'} />
                               ))}
                            </Bar>
                         </ReBarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'guide' && (
             <div className="animate-in fade-in duration-700 space-y-8">
                {isGeneratingGuide ? (
                  <div className="glass p-20 rounded-[4rem] border border-emerald-500/20 flex flex-col items-center justify-center space-y-6 text-center">
                     <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                     <h3 className="text-2xl font-bold text-white mb-2">Genererer Zen Eco Guide</h3>
                     <p className="text-slate-500 text-xs animate-pulse">Skaper strategisk innhold for det spanske boligmarkedet...</p>
                  </div>
                ) : zenGuide ? (
                  <div className="glass p-12 lg:p-20 rounded-[4rem] border border-slate-800 bg-[#0a0a0c] shadow-3xl animate-in slide-in-from-bottom-6">
                     <div className="flex justify-between items-center mb-12 border-b border-slate-800 pb-10">
                        <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">Strategisk Kjøperguide</h2>
                        <button onClick={() => {
                          navigator.clipboard.writeText(zenGuide);
                          alert("Guiden er kopiert til utklippstavlen.");
                        }} className="px-8 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all"><Copy size={16}/> Kopier Innhold</button>
                     </div>
                     <div className="prose prose-invert max-w-none 
                        prose-h2:text-white prose-h2:border-l-4 prose-h2:border-emerald-500 prose-h2:pl-6
                        prose-p:text-slate-400 prose-p:leading-[2] prose-p:text-lg
                        ">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{zenGuide}</ReactMarkdown>
                     </div>
                  </div>
                ) : (
                  <div className="glass p-20 rounded-[4rem] border border-slate-800 flex flex-col items-center justify-center space-y-6 text-center opacity-40">
                     <FileCheck size={64} className="text-slate-700" />
                     <p className="text-slate-600 font-mono text-[10px] uppercase tracking-[0.3em]">Bruk knappen i sidemenyen for å generere guiden</p>
                  </div>
                )}
             </div>
           )}
        </div>
      </div>
      <style>{`.shadow-3xl { box-shadow: 0 0 80px rgba(0,0,0,0.8); } .custom-scrollbar::-webkit-scrollbar { width: 6px; }`}</style>
    </div>
  );
};

export default GrowthHub;
