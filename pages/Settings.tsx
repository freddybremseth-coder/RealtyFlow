
import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, User, Shield, Info, Save, ShieldCheck, Palette, MapPin, 
  Camera, Mail, Phone, Globe, Trash2, Plus, Upload, Wand2, Loader2, 
  Check, Link, Share2, Database, Key, Inbox, Lock, Youtube, Music2, Linkedin, X,
  Type, MessageSquare, ExternalLink, Sparkles, Github, Terminal, GitBranch, Copy, CheckCircle2, AlertTriangle, RefreshCw, HelpCircle
} from 'lucide-react';
import { settingsStore } from '../services/settingsService';
import { gemini } from '../services/geminiService';
import { Brand, AdvisorProfile, AutomationSettings, IntegrationSettings } from '../types';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'brands' | 'profile' | 'integrations' | 'system'>('brands');
  const [brands, setBrands] = useState<Brand[]>(settingsStore.getBrands());
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  const [automation, setAutomation] = useState<AutomationSettings>(settingsStore.getAutomation());
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const advisorFileRef = useRef<HTMLInputElement>(null);
  const brandFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = settingsStore.subscribe(() => {
      setBrands(settingsStore.getBrands());
      setProfile(settingsStore.getProfile());
      setAutomation(settingsStore.getAutomation());
    });
    return unsub;
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    settingsStore.updateProfile(profile);
    alert("Profil lagret!");
  };

  const handleBrandSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrand) {
      settingsStore.updateBrand(editingBrand);
      setEditingBrand(null);
      alert("Merkevare lagret!");
    }
  };

  const handleAutomationToggle = (key: keyof AutomationSettings) => {
    const updated = { ...automation, [key]: !automation[key] };
    settingsStore.updateAutomation(updated);
  };

  const runVisualAnalysis = async (brand: Brand) => {
    setIsAnalyzing(brand.id);
    try {
      const styles = await gemini.analyzeBrandIdentity(brand.website, brand.logo);
      const updatedBrand = { ...brand, visualStyles: styles };
      settingsStore.updateBrand(updatedBrand);
    } catch (err) {
      console.error(err);
      alert("Klarte ikke å analysere brand-identitet.");
    } finally {
      setIsAnalyzing(null);
    }
  };

  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

  const handleAdvisorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await toBase64(file);
      setProfile({ ...profile, imageUrl: base64 });
    }
  };

  const handleBrandLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingBrand) {
      const base64 = await toBase64(file);
      setEditingBrand({ ...editingBrand, logo: base64 });
    }
  };

  const toggleIntegration = (brand: Brand, key: keyof IntegrationSettings) => {
    const currentIntegrations = brand.integrations || {
      facebookActive: false, instagramActive: false, linkedinActive: false,
      tiktokActive: false, youtubeActive: false, pinterestActive: false, emailSyncActive: false
    };
    
    const updatedIntegrations = {
      ...currentIntegrations,
      [key]: !currentIntegrations[key]
    };
    
    settingsStore.updateBrand({
      ...brand,
      integrations: updatedIntegrations
    });
  };

  const updateApiKey = (brand: Brand, key: keyof IntegrationSettings, value: string) => {
    const currentIntegrations = brand.integrations || {
      facebookActive: false, instagramActive: false, linkedinActive: false,
      tiktokActive: false, youtubeActive: false, pinterestActive: false, emailSyncActive: false
    };
    
    settingsStore.updateBrand({
      ...brand,
      integrations: {
        ...currentIntegrations,
        [key]: value
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-4xl font-bold neon-text text-cyan-400 mb-2">Agency Settings</h1>
        <p className="text-slate-400">Manage your brands, advisor profile, and viral AI integrations.</p>
      </header>

      <div className="flex gap-4 border-b border-slate-800 pb-px overflow-x-auto no-scrollbar">
        {[
          { id: 'brands', label: 'Brands', icon: <Building2 size={18} /> },
          { id: 'profile', label: 'Advisor', icon: <User size={18} /> },
          { id: 'integrations', label: 'Integrations', icon: <Link size={18} /> },
          { id: 'system', label: 'System', icon: <Shield size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${
              activeTab === tab.id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {activeTab === 'brands' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {brands.map((brand) => (
                <div key={brand.id} className="glass p-8 rounded-3xl border border-slate-800 group relative">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700">
                        {brand.logo ? <img src={brand.logo} className="w-full h-full object-contain" /> : <Building2 className="text-slate-500" size={28} />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-100">{brand.name}</h3>
                        <p className="text-sm text-slate-500">{brand.description}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button 
                        onClick={() => runVisualAnalysis(brand)} 
                        disabled={isAnalyzing === brand.id}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-cyan-400 flex items-center gap-2"
                       >
                         {isAnalyzing === brand.id ? <Loader2 size={12} className="animate-spin" /> : <Palette size={12} />}
                         AI Visual
                       </button>
                       <button onClick={() => setEditingBrand(brand)} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white">Edit</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="glass p-8 rounded-3xl border border-slate-800 space-y-8 animate-in fade-in">
              {/* Profile form content... */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-800 overflow-hidden border-4 border-slate-900 flex items-center justify-center text-3xl font-bold shadow-xl">
                    {profile.imageUrl ? <img src={profile.imageUrl} className="w-full h-full object-cover" /> : <span>{profile.name[0]}</span>}
                  </div>
                  <button type="button" onClick={() => advisorFileRef.current?.click()} className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <Camera className="text-white" size={24} />
                  </button>
                  <input type="file" ref={advisorFileRef} className="hidden" accept="image/*" onChange={handleAdvisorImageUpload} />
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-[10px] uppercase font-mono text-slate-500 tracking-widest">Rådgiver Navn</label>
                  <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-xl font-bold text-slate-100 focus:border-cyan-500 outline-none transition-all shadow-inner" />
                </div>
              </div>
              <button type="submit" className="px-10 py-4 bg-cyan-500 text-slate-950 rounded-2xl font-bold shadow-lg shadow-cyan-500/20 hover:bg-cyan-400 transition-all">Lagre Profil</button>
            </form>
          )}

          {activeTab === 'system' && (
            <div className="space-y-8 animate-in fade-in">
              {/* GitHub Guide & Troubleshooting Section */}
              <div className="glass p-8 rounded-[3rem] border border-cyan-500/20 bg-cyan-500/5 space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="font-bold text-white flex items-center gap-3"><Github className="text-cyan-400" /> GitHub Sync Center</h3>
                   <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                      <GitBranch size={12} /> main
                   </div>
                </div>

                {/* CRITICAL: Troubleshooting for "Repo Not Found" */}
                <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-4">
                  <AlertTriangle className="text-amber-500 flex-shrink-0 mt-1" size={24} />
                  <div className="space-y-4 flex-1">
                    <div>
                      <h4 className="text-sm font-bold text-amber-200">Problem: Kan ikke velge "Disconnect" (Repo ikke funnet)</h4>
                      <p className="text-xs text-amber-500/80 leading-relaxed mt-1">
                        Dette skjer når det gamle repoet er slettet fra GitHub. AI Studio prøver å finne det for å "lukke" koblingen, men feiler.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200/50">Løsning steg-for-steg:</p>
                      <ol className="text-xs text-slate-300 space-y-2 list-decimal ml-4">
                        <li>Logg inn på GitHub.com</li>
                        <li>Gå til <strong>Settings</strong> → <strong>Applications</strong> → <strong>Installed GitHub Apps</strong></li>
                        <li>Finn <strong>Google AI Studio</strong> og trykk <strong>Configure</strong></li>
                        <li>Rull ned til "Repository access"</li>
                        <li>Sørg for at <code>freddybremseth-coder/RealtyFlowAI</code> er lagt til i listen, eller velg "All repositories"</li>
                        <li>Trykk <strong>Save</strong></li>
                        <li>Gå tilbake hit og <strong>last siden på nytt (Refresh)</strong>. Prøv nå "Sync to GitHub" i toppmenyen.</li>
                      </ol>
                    </div>

                    <div className="flex gap-3 pt-2">
                       <a 
                        href="https://github.com/settings/installations" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-amber-400 transition-all"
                       >
                          <Settings size={14} /> Gå til GitHub App Settings
                       </a>
                       <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
                       >
                          <RefreshCw size={14} /> Oppfrisk AI Studio
                       </button>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-900 rounded-xl text-slate-400"><Terminal size={24} /></div>
                         <div>
                            <p className="text-sm font-bold text-slate-200">Mål-repository:</p>
                            <p className="text-xs text-cyan-500 font-mono">freddybremseth-coder / RealtyFlowAI</p>
                         </div>
                      </div>
                      <a 
                       href="https://github.com/freddybremseth-coder/RealtyFlowAI" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="px-6 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-2 transition-all shadow-xl"
                      >
                         <ExternalLink size={16} /> Åpne Repository
                      </a>
                   </div>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 flex items-start gap-3">
                   <HelpCircle size={16} className="text-cyan-500 mt-0.5" />
                   <div className="text-[10px] text-slate-500 leading-relaxed">
                      <strong>Merk:</strong> Den automatiske synkroniseringen er en funksjon i Google AI Studio. Hvis den fortsatt nekter å koble til, kan det hjelpe å lage en kopi av prosjektet ditt (Save As) og koble det nye prosjektet til GitHub fra starten av.
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
