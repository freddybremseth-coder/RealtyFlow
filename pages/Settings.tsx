
import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, User, Shield, Info, Save, ShieldCheck, Languages,
  Camera, Mail, Phone, Globe, Plus, Upload, X, Key,
  Inbox, CheckCircle2, AlertTriangle, Link, Zap,
  Facebook, Instagram, Linkedin, Youtube, Music2,
  Pencil, Star, MapPin, Trash2
} from 'lucide-react';
import { settingsStore, ApiKeys } from '../services/settingsService';
import { Brand, AdvisorProfile, AutomationSettings, IntegrationSettings, AppLanguage } from '../types';
import { useTranslation } from '../services/i18n';
import { supabase } from '../services/supabase';

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

  const [activeTab, setActiveTab] = useState<'brands' | 'profile' | 'integrations' | 'ai' | 'system'>('brands');
  const [brands, setBrands] = useState<Brand[]>([]);
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  const [automation, setAutomation] = useState<AutomationSettings>(settingsStore.getAutomation());
  const [apiKeys, setApiKeys] = useState<ApiKeys>(settingsStore.getApiKeys());
  const [editingBrand, setEditingBrand] = useState<Partial<Brand> | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [apiKeysSaved, setApiKeysSaved] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');

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
    if (id) {
      // Update existing brand
      const { error } = await supabase.from('brands').update(rest).eq('id', id);
      if (error) console.error('Error updating brand:', error);
    } else {
      // Create new brand
      const { error } = await supabase.from('brands').insert([rest]);
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

  const TABS = [
    { id: 'brands', label: t.st_brands || 'Selskaper', icon: <Building2 size={16} /> },
    { id: 'profile', label: t.st_advisor || 'Rådgiver', icon: <User size={16} /> },
    { id: 'ai', label: 'AI-nøkler', icon: <Key size={16} /> },
    { id: 'integrations', label: t.st_integrations || 'Kanaler', icon: <Link size={16} /> },
    { id: 'system', label: t.st_system || 'System', icon: <Shield size={16} /> },
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
      {/* Other tabs remain the same for now */}
    </div>
  );
};

export default Settings;
