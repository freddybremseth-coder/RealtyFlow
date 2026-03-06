
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { gemini } from '../services/claudeService';
import { marketStore } from '../services/marketService';
import { propertyStore } from '../services/propertyService';
import { settingsStore } from '../services/settingsService';
import { campaignStore, MarketingCampaign } from '../services/campaignService';
import { supabase } from '../services/supabase';
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
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'ads' | 'automation' | 'stats' | 'guide' | 'library'>('ads');
  const [isGenerating, setIsGenerating] = useState(false);
  const [adResult, setAdResult] = useState<any>(null);
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [objective, setObjective] = useState('Skap lyst på boligdrømmen i Spania.');
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

  async function fetchBrands() {
    const { data, error } = await supabase.from('brands').select('*');
    if (error) {
      console.error('Error fetching brands:', error);
      return;
    }
    setBrands(data as Brand[]);
    if (data && data.length > 0) {
        setSelectedBrandId(data[0].id);
    }
  }
  
  useEffect(() => {
    fetchBrands();
    if (location.state?.marketIntel) {
      addAssetToContext({ type: 'market', data: location.state.marketIntel });
    }
  }, [location.state]);

  useEffect(() => {
    const selectedBrand = brands.find(b => b.id === selectedBrandId);
    if (selectedBrand && selectedContextAssets.length === 0) {
      setObjective(`Fokuser på ${selectedBrand.name}. ${selectedBrand.description || 'Skap lyst på boligdrømmen i Spania.'}`);
    }
  }, [selectedBrandId, brands]);

  useEffect(() => {
    const unsub = settingsStore.subscribe(() => {
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
    if (!selectedBrandId) return;
    setIsGenerating(true);
    setAdResult(null);
    setSelectedHeadline(null);
    setImageError(null);
    setErrorMsg(null);
    setGeneratedImage(null);
    try {
      const brandName = brands.find(b => b.id === selectedBrandId)?.name || 'default';
      const result = await gemini.generateViralAd(brandName, objective, 'Facebook/Instagram');
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
    if (!adResult || !selectedHeadline || !selectedBrandId) return;
    setIsSaving(true);
    try {
      const brandName = brands.find(b => b.id === selectedBrandId)?.name || 'default';
      const campaign: MarketingCampaign = {
        id: `cp-${Date.now()}`,
        date: new Date().toLocaleDateString('nb-NO'),
        brandId: brandName,
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

    const handlePublishArticle = async (content: string, title: string, category: 'guide' | 'blog_post' | 'market_pulse') => {
        if (!content || !selectedBrandId) return;
        setIsPublishing(true);
        try {
            const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const brandName = brands.find(b => b.id === selectedBrandId)?.name || 'default';
            const { error } = await supabase.from('articles').insert([{
                title: title,
                slug: `${slug}-${new Date().getTime()}`,
                content_markdown: content,
                category: category,
                status: 'published',
                target_brands: [brandName]
            }]);

            if (error) throw error;

            alert(`'${title}' er publisert!`);
        } catch (error) {
            console.error('Publiseringsfeil:', error);
            alert('En feil oppstod under publisering.');
        } finally {
            setIsPublishing(false);
        }
    };

  const toggleAutomation = (key: keyof AutomationSettings) => {
    const updated = { ...automation, [key]: !automation[key] };
    settingsStore.updateAutomation(updated);
  };

  const handleGenerateGuide = async () => {
    if(!selectedBrandId) return;
    setIsGeneratingGuide(true);
    setActiveTab('guide');
    try {
      const brandName = brands.find(b => b.id === selectedBrandId)?.name || 'default';
      const res = await gemini.generateZenEcoGuide(brandName);
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
          <div className="glass p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-slate-800 space-y-6 sm:space-y-8 shadow-2xl">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.3em] mb-4 ml-1">Aktivt Brand</label>
              <div className="grid grid-cols-1 gap-2">
                {brands.map(b => (
                  <button 
                    key={b.id}
                    onClick={() => setSelectedBrandId(b.id)}
                    className={`p-4 rounded-2xl border flex items-center justify-between font-bold text-sm transition-all ${selectedBrandId === b.id ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
                  >
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                          {b.logo_url ? <img src={b.logo_url} className="w-full h-full object-contain" /> : <Building2 size={16} />}
                       </div>
                       {b.name}
                    </div>
                    {selectedBrandId === b.id && <Zap size={14} className="animate-pulse" />}
                  </button>
                ))}
                 {brands.length === 0 && <p className="text-slate-500 text-xs text-center py-4">Ingen merkevarer funnet. Legg til en i Innstillinger.</p>}
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
                  disabled={isGeneratingGuide || !selectedBrandId}
                  className="w-full py-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-500/20 transition-all shadow-lg disabled:opacity-50"
               >
                  {isGeneratingGuide ? <Loader2 className="animate-spin" size={18} /> : <FileCheck size={18} />}
                  Generer Zen Eco Guide
               </button>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-8 space-y-8">
           {activeTab === 'ads' && (
             <div className="space-y-8">
                <div className="glass p-4 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-slate-800 bg-gradient-to-br from-slate-900/50 to-transparent shadow-2xl space-y-4 sm:space-y-6">
                   <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-bold text-white flex items-center gap-3"><Sparkles className="text-cyan-400" size={24} /> Kampanjestrategi</h3>
                   </div>
                   <textarea
                     value={objective}
                     onChange={(e) => setObjective(e.target.value)}
                     className="w-full bg-slate-950 border border-slate-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 text-sm sm:text-lg text-slate-200 min-h-[120px] sm:min-h-[150px] outline-none focus:border-cyan-500 transition-all"
                     placeholder="Skriv din brief her..."
                   />
                   <div className="flex justify-end">
                      <button 
                        onClick={handleGenerateAd}
                        disabled={isGenerating || !selectedBrandId}
                        className="px-12 py-5 bg-cyan-500 text-slate-950 rounded-2xl font-bold flex items-center gap-3 hover:bg-cyan-400 shadow-2xl shadow-cyan-500/30 disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <MonitorPlay size={24} />}
                        {isGenerating ? 'Tenker...' : 'Lag Kampanje'}
                      </button>
                   </div>
                </div>

                {adResult && (
                  <div className="animate-in slide-in-from-bottom-6 duration-700 space-y-8">
                    <div className="glass p-4 sm:p-12 rounded-2xl sm:rounded-[4rem] border border-slate-800 bg-[#0a0a0c] relative overflow-hidden shadow-3xl">
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
                               <img src={generatedImage} className="w-full h-full object-cover animate-in zoom-in-95 duration-700" />
                             ) : isGeneratingImage ? (
                               <div className="text-center space-y-4">
                                 <Loader2 className="animate-spin text-indigo-400 mx-auto" size={40} />
                                 <p className="text-slate-500 text-[10px] font-mono uppercase tracking-[0.2em]">Genererer bilde...</p>
                               </div>
                             ) : imageError ? (
                               <div className="text-center space-y-4 p-8">
                                 <AlertCircle className="text-red-400 mx-auto" size={36} />
                                 <p className="text-red-400 text-xs font-bold">Bildegenerering feilet</p>
                                 <p className="text-slate-500 text-[10px] leading-relaxed">{imageError}</p>
                                 <button onClick={() => setImageError(null)} className="text-[10px] text-slate-500 hover:text-white underline">Prøv igjen</button>
                               </div>
                             ) : (
                               <div className="text-center space-y-4">
                                  <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
                                    <ImageIcon className="text-slate-700" size={32} />
                                  </div>
                                  <p className="text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">Venter på bilde-generering</p>
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
                          onClick={() => handlePublishArticle(adResult.bodyOptions[0], selectedHeadline || 'Ny Kampanje', 'blog_post')}
                          disabled={isPublishing || !generatedImage || !selectedHeadline}
                          className="w-full py-5 bg-emerald-500 text-slate-950 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-emerald-400 shadow-2xl shadow-emerald-500/30 transition-all active:scale-95"
                        >
                            {isPublishing ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
                            Publiser Kampanje
                        </button
                    </div>
                  </div>
                )}
             </div>
           )}
           {/* Other tabs follow the same pattern */}
        </div>
      </div>
      <style>{`.shadow-3xl { box-shadow: 0 0 80px rgba(0,0,0,0.8); } .custom-scrollbar::-webkit-scrollbar { width: 6px; }`}</style>
    </div>
  );
};

export default GrowthHub;
