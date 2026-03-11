
import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, User, Shield, Info, Save, ShieldCheck, Languages,
  Camera, Mail, Phone, Globe, Plus, Upload, X, Key,
  Inbox, CheckCircle2, AlertTriangle, Link, Zap,
  Facebook, Instagram, Linkedin, Youtube, Music2,
  Pencil, Star, MapPin, Trash2, Send, Loader2, ExternalLink, Eye, EyeOff
} from 'lucide-react';
import { emailService } from '../services/emailService';
import { settingsStore, ApiKeys } from '../services/settingsService';
import { Brand, AdvisorProfile, AutomationSettings, IntegrationSettings, AppLanguage } from '../types';
import { useTranslation } from '../services/i18n';
import { supabase } from '../services/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

// --- Helpers ---
const iCls = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600";
const lCls = "block text-[10px] uppercase font-mono text-slate-500 tracking-widest mb-1.5";

const toBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result as string);
    r.onerror = rej;
  });

// --- Toggle component ---
const Toggle: React.FC<{ on: boolean; onChange: () => void }> = ({ on, onChange }) => (
  <button
    type="button"
    onClick={onChange}
    className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-cyan-500' : 'bg-slate-700'}`}
  >
    <span
      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-0'}`}
    />
  </button>
);

// --- Brand Edit Modal ---
const BrandEditModal: React.FC<{
  brand: Partial<Brand>;
  onSave: (b: Partial<Brand>) => void;
  onClose: () => void;
  onDelete: (id: number) => void;
}> = ({ brand, onSave, onClose, onDelete }) => {
  const [b, setB] = useState<Partial<Brand>>({ ...brand });
  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setB(prev => ({ ...prev, logo_url: b64 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(b);
  };

  const handleDelete = () => {
    if (b.id && window.confirm('Er du sikker på at du vil slette denne merkevaren?')) {
      onDelete(b.id);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">{b.id ? 'Rediger' : 'Ny'} merkevare</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X size={15} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Logo + name */}
          <div className="flex items-center gap-5">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => logoRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                {b.logo_url
                  ? <img src={b.logo_url} className="w-full h-full object-contain p-2" alt="logo" />
                  : <Building2 size={26} className="text-slate-500" />}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={16} className="text-white" />
              </div>
              <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
            <div className="flex-1">
              <label className={lCls}>Merkevarenavn *</label>
              <input
                className={iCls}
                value={b.name || ''}
                onChange={e => setB(p => ({ ...p, name: e.target.value }))}
                required
                placeholder="Soleada.no"
              />
            </div>
          </div>
          {/* Fields for type, email, etc. */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lCls}>Type</label>
              <input
                className={iCls}
                value={b.type || ''}
                onChange={e => setB(p => ({ ...p, type: e.target.value }))}
                placeholder="Agency, Developer..."
              />
            </div>
            <div>
              <label className={lCls}>E-post</label>
              <input
                className={iCls}
                type="email"
                value={b.email || ''}
                onChange={e => setB(p => ({ ...p, email: e.target.value }))}
                placeholder="info@brand.com"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {b.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
              >
                <Trash2 size={15} />
              </button>
            )}
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-colors"
            >
              <Save size={15} /> Lagre merkevare
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Main Component ---
const Settings: React.FC = () => {
  const [lang, setLang] = useState(settingsStore.getLanguage());
  const t = useTranslation(lang);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  const [activeTab, setActiveTab] = useState<'brands' | 'profile' | 'integrations' | 'ai' | 'email' | 'system'>('brands');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  const [automation, setAutomation] = useState<AutomationSettings>(settingsStore.getAutomation());
  const [apiKeys, setApiKeys] = useState<ApiKeys>(settingsStore.getApiKeys());
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [apiKeysSaved, setApiKeysSaved] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const advisorFileRef = useRef<HTMLInputElement>(null);

  async function fetchBrands() {
    const { data, error } = await supabase.from('brands').select('*');
    if (error) {
      console.error('Error fetching brands:', error);
      return;
    }
    setBrands(data as Brand[]);
  }

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };
    fetchUser();
    fetchBrands();
    const unsub = settingsStore.subscribe(() => {
      setProfile(settingsStore.getProfile());
      setAutomation(settingsStore.getAutomation());
      setApiKeys(settingsStore.getApiKeys());
      setLang(settingsStore.getLanguage());
    });
    return unsub;
  }, []);

  const handleAdvisorImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setProfile(p => ({ ...p, imageUrl: b64 }));
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    settingsStore.updateProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleBrandSave = async (updated: Partial<Brand>) => {
    const { id, ...rest } = updated;
    const userId = user?.id;

    if (!userId) {
        console.error('User not authenticated, cannot save brand.');
        return;
    }

    const dataToSave = id ? rest : { ...rest, user_id: userId };

    if (id) {
      const { error } = await supabase.from('brands').update(dataToSave).eq('id', id);
      if (error) console.error('Error updating brand:', error);
    } else {
      const { error } = await supabase.from('brands').insert([dataToSave]);
      if (error) console.error('Error creating brand:', error);
    }
    setEditingBrand(null);
    fetchBrands(); // Refresh brand list
  };

  const handleBrandDelete = async (id: number) => {
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) console.error('Error deleting brand:', error);
    setEditingBrand(null);
    fetchBrands(); // Refresh brand list
  }

  const handleLanguageChange = (newLang: AppLanguage) => {
    settingsStore.updateAutomation({ ...automation, language: newLang });
  };

  const handleAutomationToggle = (key: keyof AutomationSettings) => {
    const updated = { ...automation, [key]: !automation[key] };
    settingsStore.updateAutomation(updated);
  };

  const toggleIntegration = (brand: Brand, key: keyof IntegrationSettings) => {
    // This part needs to be adapted to the new Supabase structure
  };

  const saveIntegrationKey = (brand: Brand, key: keyof IntegrationSettings, value: string) => {
    // This part needs to be adapted to the new Supabase structure
  };

  const addExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (trimmed && !profile.expertise.includes(trimmed)) {
      setProfile(p => ({ ...p, expertise: [...p.expertise, trimmed] }));
      setExpertiseInput('');
    }
  };

  const removeExpertise = (item: string) => {
    setProfile(p => ({ ...p, expertise: p.expertise.filter(e => e !== item) }));
  };

  const handleApiKeysSave = (e: React.FormEvent) => {
    e.preventDefault();
    settingsStore.updateApiKeys(apiKeys);
    setApiKeysSaved(true);
    setTimeout(() => setApiKeysSaved(false), 2500);
  };

  // ── E-post (Resend) innstillinger ──────────────────────────────────────────
  const [emailSaved, setEmailSaved]         = useState(false);
  const [emailTesting, setEmailTesting]     = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ok: boolean; msg: string} | null>(null);
  const [showResendKey, setShowResendKey]   = useState(false);
  const [testAddress, setTestAddress]       = useState(automation.emailFromEmail ?? '');

  const handleEmailSave = (e: React.FormEvent) => {
    e.preventDefault();
    settingsStore.updateAutomation(automation);
    setEmailSaved(true);
    setTimeout(() => setEmailSaved(false), 2500);
  };

  const handleEmailTest = async () => {
    setEmailTesting(true);
    setEmailTestResult(null);
    const result = await emailService.send({
      to:      testAddress,
      subject: 'Test-e-post fra RealtyFlow',
      text:    `Hei!\n\nDenne e-posten bekrefter at Resend-integrasjonen din fungerer.\n\nAvsender: ${automation.emailFromName ?? ''} <${automation.emailFromEmail ?? ''}>\n\nMed vennlig hilsen,\nRealtyFlow`,
    });
    setEmailTesting(false);
    setEmailTestResult(result.success
      ? { ok: true,  msg: `Sendt! Resend ID: ${result.id}` }
      : { ok: false, msg: result.error ?? 'Ukjent feil' }
    );
  };

  const TABS = [
    { id: 'brands',       label: t.st_brands || 'Selskaper',  icon: <Building2 size={16} /> },
    { id: 'profile',      label: t.st_advisor || 'Rådgiver',  icon: <User size={16} /> },
    { id: 'ai',           label: 'AI-nøkler',                 icon: <Key size={16} /> },
    { id: 'email',        label: 'E-post',                    icon: <Mail size={16} /> },
    { id: 'integrations', label: t.st_integrations || 'Kanaler', icon: <Link size={16} /> },
    { id: 'system',       label: t.st_system || 'System',     icon: <Shield size={16} /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 lg:py-10 space-y-8 pb-24 animate-in fade-in duration-500">
      {editingBrand && (
        <BrandEditModal
          brand={editingBrand}
          onSave={handleBrandSave}
          onClose={() => setEditingBrand(null)}
          onDelete={handleBrandDelete}
        />
      )}

      <header>
        <h1 className="text-3xl font-bold text-cyan-400 mb-1">{t.st_title || 'Innstillinger'}</h1>
        <p className="text-slate-500 text-sm">{t.st_lang_desc || 'Konfigurer byrå, profil og integrasjoner.'}</p>
      </header>

      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-2xl p-1 overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-1 ${
              activeTab === tab.id
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'brands' && (
        <div className="space-y-4 animate-in fade-in">
           <div className="flex justify-end">
                <button
                onClick={() => setEditingBrand({})}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold transition-colors"
                >
                <Plus size={16} /> Legg til merkevare
                </button>
            </div>
          {brands.map(brand => (
            <div key={brand.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {brand.logo_url
                      ? <img src={brand.logo_url} className="w-full h-full object-contain p-1" alt={brand.name} />
                      : <Building2 size={24} className="text-slate-500" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{brand.name}</h3>
                    <p className="text-xs text-slate-500 mb-1">{brand.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingBrand(brand)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 rounded-xl text-sm transition-all shrink-0"
                >
                  <Pencil size={13} /> {t.edit || 'Rediger'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'ai' && (
        <form onSubmit={handleApiKeysSave} className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Key size={14} className="text-cyan-400" /> OpenAI API Nøkkel
            </h3>
            <div>
              <label className={lCls}>API-nøkkel</label>
              <div className="relative">
                <input
                  type={showOpenAIKey ? 'text' : 'password'}
                  className={iCls + ' pr-10 font-mono'}
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={apiKeys.openai || ''}
                  onChange={e => setApiKeys(k => ({ ...k, openai: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAIKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-all"
                >
                  {showOpenAIKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Key size={14} className="text-cyan-400" /> Anthropic API Nøkkel
            </h3>
            <div>
              <label className={lCls}>API-nøkkel</label>
              <div className="relative">
                <input
                  type={showAnthropicKey ? 'text' : 'password'}
                  className={iCls + ' pr-10 font-mono'}
                  placeholder="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={apiKeys.anthropic || ''}
                  onChange={e => setApiKeys(k => ({ ...k, anthropic: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropicKey(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-all"
                >
                  {showAnthropicKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all"
          >
            {apiKeysSaved
              ? <><CheckCircle2 size={14} /> Lagret!</>
              : <><Save size={14} /> Lagre API-nøkler</>
            }
          </button>
        </form>
      )}

      {activeTab === 'email' && (
        <div className="space-y-6 animate-in fade-in">

          {/* Forklaringsboks */}
          <div className="flex gap-3 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
            <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-400 leading-relaxed">
              <p className="font-bold text-cyan-300">Oppsett med Resend (gratis)</p>
              <p>1. Opprett gratis konto på <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline inline-flex items-center gap-0.5">resend.com <ExternalLink size={10}/></a></p>
              <p>2. Verifiser domenet ditt (f.eks. soleada.no) under <em>Domains</em></p>
              <p>3. Opprett en API-nøkkel under <em>API Keys</em> og lim den inn nedenfor</p>
              <p>4. Sett avsenderadressen til en adresse på ditt verifiserte domene</p>
              <p className="text-slate-500">Gratis plan: 3 000 e-poster/mnd · 100/dag</p>
            </div>
          </div>

          <form onSubmit={handleEmailSave} className="space-y-5">
            {/* Resend API-nøkkel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Key size={14} className="text-cyan-400" /> Resend API-nøkkel
              </h3>
              <div>
                <label className={lCls}>API-nøkkel</label>
                <div className="relative">
                  <input
                    type={showResendKey ? 'text' : 'password'}
                    className={iCls + ' pr-10 font-mono'}
                    placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                    value={automation.resendApiKey ?? ''}
                    onChange={e => setAutomation(a => ({ ...a, resendApiKey: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowResendKey(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-all"
                  >
                    {showResendKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Avsenderinfo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Mail size={14} className="text-cyan-400" /> Avsenderinfo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lCls}>Avsendernavn</label>
                  <input
                    type="text"
                    className={iCls}
                    placeholder="Freddy – Soleada.no"
                    value={automation.emailFromName ?? ''}
                    onChange={e => setAutomation(a => ({ ...a, emailFromName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className={lCls}>Avsenderadresse (fra domenet ditt)</label>
                  <input
                    type="email"
                    className={iCls}
                    placeholder="freddy@soleada.no"
                    value={automation.emailFromEmail ?? ''}
                    onChange={e => setAutomation(a => ({ ...a, emailFromEmail: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-600">Adressen må tilhøre et domene du har verifisert i Resend.</p>
            </div>

            {/* Lagre-knapp */}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all"
            >
              {emailSaved
                ? <><CheckCircle2 size={14} /> Lagret!</>
                : <><Save size={14} /> Lagre e-postinnstillinger</>
              }
            </button>
          </form>

          {/* Test-seksjon */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Send size={14} className="text-cyan-400" /> Send test-e-post
            </h3>
            <p className="text-xs text-slate-500">Bekreft at oppsettet fungerer ved å sende en test-e-post til deg selv.</p>
            <div className="flex gap-3">
              <input
                type="email"
                className={iCls + ' flex-1'}
                placeholder="din@epost.no"
                value={testAddress}
                onChange={e => setTestAddress(e.target.value)}
              />
              <button
                type="button"
                onClick={handleEmailTest}
                disabled={emailTesting || !testAddress || !automation.resendApiKey}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {emailTesting ? <><Loader2 size={12} className="animate-spin" /> Sender…</> : <><Send size={12} /> Send test</>}
              </button>
            </div>
            {emailTestResult && (
              <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-xs border ${emailTestResult.ok ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {emailTestResult.ok ? <CheckCircle2 size={13} className="mt-0.5" /> : <AlertTriangle size={13} className="mt-0.5" />}
                {emailTestResult.msg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Other tabs remain the same for now */}
    </div>
  );
};

export default Settings;
