
import React, { useState, useEffect, useRef } from 'react';
import {
  Building2, User, Shield, Info, Save, ShieldCheck, Languages,
  Camera, Mail, Phone, Globe, Plus, Upload, X, Key,
  Inbox, CheckCircle2, AlertTriangle, Link, Zap,
  Facebook, Instagram, Linkedin, Youtube, Music2,
  Pencil, Star, MapPin
} from 'lucide-react';
import { settingsStore } from '../services/settingsService';
import { Brand, AdvisorProfile, AutomationSettings, IntegrationSettings, AppLanguage } from '../types';
import { useTranslation } from '../services/i18n';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iCls = "w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20 transition-all placeholder:text-slate-600";
const lCls = "block text-[10px] uppercase font-mono text-slate-500 tracking-widest mb-1.5";

const toBase64 = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.readAsDataURL(file);
    r.onload = () => res(r.result as string);
    r.onerror = rej;
  });

// ─── Toggle component ─────────────────────────────────────────────────────────
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

// ─── Brand Edit Modal ─────────────────────────────────────────────────────────
const BrandEditModal: React.FC<{
  brand: Brand;
  onSave: (b: Brand) => void;
  onClose: () => void;
}> = ({ brand, onSave, onClose }) => {
  const [b, setB] = useState<Brand>({ ...brand });
  const logoRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const b64 = await toBase64(file);
    setB(prev => ({ ...prev, logo: b64 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(b);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Rediger merkevare</h2>
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
                {b.logo
                  ? <img src={b.logo} className="w-full h-full object-contain p-2" alt="logo" />
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
                value={b.name}
                onChange={e => setB(p => ({ ...p, name: e.target.value }))}
                required
                placeholder="Soleada.no"
              />
            </div>
          </div>

          {/* Type + tone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lCls}>Type</label>
              <select
                className={iCls}
                value={b.type}
                onChange={e => setB(p => ({ ...p, type: e.target.value }))}
              >
                {['Agency', 'Eiendomsmegler & Utbygger', 'Eco-Living', 'Development', 'Luxury', 'Commercial', 'Annet'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lCls}>Tone / stil</label>
              <input
                className={iCls}
                value={b.tone}
                onChange={e => setB(p => ({ ...p, tone: e.target.value }))}
                placeholder="Professional, Exclusive..."
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={lCls}>Beskrivelse</label>
            <textarea
              className={`${iCls} resize-none`}
              rows={3}
              value={b.description}
              onChange={e => setB(p => ({ ...p, description: e.target.value }))}
              placeholder="Kort beskrivelse av merkevaren..."
            />
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lCls}>E-post</label>
              <input
                className={iCls}
                type="email"
                value={b.email}
                onChange={e => setB(p => ({ ...p, email: e.target.value }))}
                placeholder="info@soleada.no"
              />
            </div>
            <div>
              <label className={lCls}>Nettside</label>
              <input
                className={iCls}
                value={b.website}
                onChange={e => setB(p => ({ ...p, website: e.target.value }))}
                placeholder="https://soleada.no"
              />
            </div>
            <div>
              <label className={lCls}>Telefon (primær)</label>
              <input
                className={iCls}
                type="tel"
                value={b.phone}
                onChange={e => setB(p => ({ ...p, phone: e.target.value }))}
                placeholder="+47 000 00 000"
              />
            </div>
            <div>
              <label className={lCls}>Telefon (sekundær)</label>
              <input
                className={iCls}
                type="tel"
                value={b.phone2 || ''}
                onChange={e => setB(p => ({ ...p, phone2: e.target.value }))}
                placeholder="+34 600 000 000"
              />
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className={lCls}>Merkevarefarger</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Primærfarge', key: 'primaryColor' as const, fallback: '#06b6d4' },
                { label: 'Sekundærfarge', key: 'secondaryColor' as const, fallback: '#f97316' },
              ].map(({ label, key, fallback }) => (
                <div key={key} className="flex items-center gap-3 p-3 bg-slate-800/60 rounded-xl">
                  <input
                    type="color"
                    value={b.visualStyles?.[key] || fallback}
                    onChange={e => setB(p => ({
                      ...p,
                      visualStyles: {
                        primaryColor: p.visualStyles?.primaryColor || '#06b6d4',
                        secondaryColor: p.visualStyles?.secondaryColor || '#f97316',
                        fontHeading: p.visualStyles?.fontHeading || 'Inter',
                        fontBody: p.visualStyles?.fontBody || 'Inter',
                        [key]: e.target.value
                      }
                    }))}
                    className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-xs text-slate-400">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-xl transition-colors"
            >
              <Save size={15} /> Lagre merkevare
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            >
              Avbryt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Settings: React.FC = () => {
  const [lang, setLang] = useState(settingsStore.getLanguage());
  const t = useTranslation(lang);

  const [activeTab, setActiveTab] = useState<'brands' | 'profile' | 'integrations' | 'system'>('brands');
  const [brands, setBrands] = useState<Brand[]>(settingsStore.getBrands());
  const [profile, setProfile] = useState<AdvisorProfile>(settingsStore.getProfile());
  const [automation, setAutomation] = useState<AutomationSettings>(settingsStore.getAutomation());
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState('');

  const advisorFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = settingsStore.subscribe(() => {
      setBrands(settingsStore.getBrands());
      setProfile(settingsStore.getProfile());
      setAutomation(settingsStore.getAutomation());
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

  const handleBrandSave = (updated: Brand) => {
    settingsStore.updateBrand(updated);
    setEditingBrand(null);
  };

  const handleLanguageChange = (newLang: AppLanguage) => {
    settingsStore.updateAutomation({ ...automation, language: newLang });
  };

  const handleAutomationToggle = (key: keyof AutomationSettings) => {
    const updated = { ...automation, [key]: !automation[key] };
    settingsStore.updateAutomation(updated);
  };

  const toggleIntegration = (brand: Brand, key: keyof IntegrationSettings) => {
    const current: IntegrationSettings = brand.integrations || {
      facebookActive: false, instagramActive: false, linkedinActive: false,
      tiktokActive: false, youtubeActive: false, pinterestActive: false, emailSyncActive: false
    };
    settingsStore.updateBrand({ ...brand, integrations: { ...current, [key]: !current[key] } });
  };

  const saveIntegrationKey = (brand: Brand, key: keyof IntegrationSettings, value: string) => {
    const current: IntegrationSettings = brand.integrations || {
      facebookActive: false, instagramActive: false, linkedinActive: false,
      tiktokActive: false, youtubeActive: false, pinterestActive: false, emailSyncActive: false
    };
    settingsStore.updateBrand({ ...brand, integrations: { ...current, [key]: value } });
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

  const TABS = [
    { id: 'brands', label: t.st_brands || 'Merkevarer', icon: <Building2 size={16} /> },
    { id: 'profile', label: t.st_advisor || 'Rådgiver', icon: <User size={16} /> },
    { id: 'integrations', label: t.st_integrations || 'Integrasjoner', icon: <Link size={16} /> },
    { id: 'system', label: t.st_system || 'System', icon: <Shield size={16} /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 lg:py-10 space-y-8 pb-24 animate-in fade-in duration-500">
      {/* Brand Edit Modal */}
      {editingBrand && (
        <BrandEditModal
          brand={editingBrand}
          onSave={handleBrandSave}
          onClose={() => setEditingBrand(null)}
        />
      )}

      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-cyan-400 mb-1">{t.st_title || 'Innstillinger'}</h1>
        <p className="text-slate-500 text-sm">{t.st_lang_desc || 'Konfigurer byrå, profil og integrasjoner.'}</p>
      </header>

      {/* Tab bar */}
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

      {/* ══════════════ BRANDS TAB ══════════════ */}
      {activeTab === 'brands' && (
        <div className="space-y-4 animate-in fade-in">
          {brands.map(brand => (
            <div key={brand.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {brand.logo
                      ? <img src={brand.logo} className="w-full h-full object-contain p-1" alt={brand.name} />
                      : <Building2 size={24} className="text-slate-500" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{brand.name}</h3>
                    <p className="text-xs text-slate-500 mb-1">{brand.type}</p>
                    <p className="text-sm text-slate-400">{brand.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingBrand(brand)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 rounded-xl text-sm transition-all shrink-0"
                >
                  <Pencil size={13} /> {t.edit || 'Rediger'}
                </button>
              </div>

              {/* Info row */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap gap-4">
                {brand.email && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Mail size={12} className="text-cyan-500" /> {brand.email}
                  </div>
                )}
                {brand.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Phone size={12} className="text-cyan-500" /> {brand.phone}
                  </div>
                )}
                {brand.website && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Globe size={12} className="text-cyan-500" />
                    <a href={brand.website} target="_blank" rel="noreferrer"
                      className="hover:text-cyan-400 transition-colors">{brand.website}</a>
                  </div>
                )}
                {brand.visualStyles?.primaryColor && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-3 h-3 rounded-full border border-slate-600 inline-block"
                      style={{ background: brand.visualStyles.primaryColor }} />
                    <span className="w-3 h-3 rounded-full border border-slate-600 inline-block"
                      style={{ background: brand.visualStyles.secondaryColor }} />
                    Farger
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════ PROFILE TAB ══════════════ */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-5 animate-in fade-in">
          {/* Avatar + Name */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rådgiverprofil</h3>
            <div className="flex items-center gap-6">
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => advisorFileRef.current?.click()}
              >
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl font-bold text-white overflow-hidden border-4 border-slate-800 shadow-xl">
                  {profile.imageUrl
                    ? <img src={profile.imageUrl} className="w-full h-full object-cover" alt={profile.name} />
                    : <span>{profile.name?.[0] || 'A'}</span>}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
                <input type="file" ref={advisorFileRef} className="hidden" accept="image/*" onChange={handleAdvisorImageUpload} />
              </div>
              <div className="flex-1">
                <label className={lCls}>Fullt navn *</label>
                <input
                  className={iCls}
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Freddy Bremseth"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={lCls}>Telefon (primær)</label>
                <input
                  className={iCls} type="tel"
                  value={profile.phone || ''}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+47 960 09 99 65"
                />
              </div>
              <div>
                <label className={lCls}>Telefon (Spania)</label>
                <input
                  className={iCls} type="tel"
                  value={profile.phone2 || ''}
                  onChange={e => setProfile(p => ({ ...p, phone2: e.target.value }))}
                  placeholder="+34 600 000 000"
                />
              </div>
              <div>
                <label className={lCls}>Primær lokasjon</label>
                <input
                  className={iCls}
                  value={profile.location}
                  onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                  placeholder="Benidorm, Costa Blanca"
                />
              </div>
              <div>
                <label className={lCls}>Sekundær lokasjon</label>
                <input
                  className={iCls}
                  value={profile.secondaryLocation || ''}
                  onChange={e => setProfile(p => ({ ...p, secondaryLocation: e.target.value }))}
                  placeholder="Biar, Inland"
                />
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">E-post signatur</h3>
            <textarea
              className={`${iCls} resize-none`}
              rows={4}
              value={profile.signature || ''}
              onChange={e => setProfile(p => ({ ...p, signature: e.target.value }))}
              placeholder={`Med vennlig hilsen,\nFreddy Bremseth\nEiendomsrådgiver · Soleada.no\n+47 960 09 99 65`}
            />
          </div>

          {/* Expertise */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ekspertiseområder</h3>
            <div className="flex gap-2">
              <input
                className={`${iCls} flex-1`}
                value={expertiseInput}
                onChange={e => setExpertiseInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExpertise(); } }}
                placeholder="F.eks. Costa Blanca North, Nybygg, Luksus..."
              />
              <button
                type="button"
                onClick={addExpertise}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-colors font-bold"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.expertise.map(item => (
                <span
                  key={item}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs rounded-full"
                >
                  <Star size={10} fill="currentColor" />
                  {item}
                  <button
                    type="button"
                    onClick={() => removeExpertise(item)}
                    className="hover:text-red-400 transition-colors ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              {profile.expertise.length === 0 && (
                <p className="text-slate-600 text-xs italic">Ingen ekspertiseområder lagt til ennå.</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all ${
              profileSaved
                ? 'bg-emerald-500 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
            }`}
          >
            {profileSaved
              ? <><CheckCircle2 size={16} /> Lagret!</>
              : <><Save size={16} /> Lagre profil</>}
          </button>
        </form>
      )}

      {/* ══════════════ INTEGRATIONS TAB ══════════════ */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in">
          {brands.map(brand => (
            <div key={brand.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* Brand header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-800 bg-slate-950/60">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                  {brand.logo
                    ? <img src={brand.logo} className="w-full h-full object-contain p-0.5" alt="" />
                    : <Building2 size={14} className="text-slate-500" />}
                </div>
                <span className="font-bold text-slate-200">{brand.name}</span>
                <span className="text-xs text-slate-600 ml-auto">{brand.type}</span>
              </div>

              <div className="p-6 space-y-6">
                {/* Social toggles */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Sosiale kanaler</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {([
                      { key: 'facebookActive' as keyof IntegrationSettings, label: 'Facebook', icon: <Facebook size={15} className="text-blue-400" /> },
                      { key: 'instagramActive' as keyof IntegrationSettings, label: 'Instagram', icon: <Instagram size={15} className="text-pink-400" /> },
                      { key: 'linkedinActive' as keyof IntegrationSettings, label: 'LinkedIn', icon: <Linkedin size={15} className="text-blue-500" /> },
                      { key: 'tiktokActive' as keyof IntegrationSettings, label: 'TikTok', icon: <Music2 size={15} className="text-slate-200" /> },
                      { key: 'youtubeActive' as keyof IntegrationSettings, label: 'YouTube', icon: <Youtube size={15} className="text-red-400" /> },
                      { key: 'pinterestActive' as keyof IntegrationSettings, label: 'Pinterest', icon: <span className="text-red-500 font-bold text-xs">P</span> },
                    ]).map(({ key, label, icon }) => (
                      <div key={key} className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
                          <span className="text-sm text-slate-300">{label}</span>
                        </div>
                        <Toggle
                          on={!!(brand.integrations?.[key])}
                          onChange={() => toggleIntegration(brand, key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* E-post sync */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">E-post</p>
                  <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl mb-3">
                    <div className="flex items-center gap-2">
                      <Inbox size={15} className="text-emerald-400" />
                      <span className="text-sm text-slate-300">E-post Sync</span>
                    </div>
                    <Toggle
                      on={!!brand.integrations?.emailSyncActive}
                      onChange={() => toggleIntegration(brand, 'emailSyncActive')}
                    />
                  </div>
                  {brand.integrations?.emailSyncActive && (
                    <div>
                      <label className={lCls}>App-passord (Gmail / Outlook)</label>
                      <input
                        className={iCls}
                        type="password"
                        defaultValue={brand.integrations?.emailAppPassword || ''}
                        placeholder="xxxx xxxx xxxx xxxx"
                        onBlur={e => saveIntegrationKey(brand, 'emailAppPassword', e.target.value)}
                      />
                      <p className="text-[11px] text-slate-600 mt-1.5 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Bruk app-spesifikt passord — ikke ditt vanlige passord.
                      </p>
                    </div>
                  )}
                </div>

                {/* API keys */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">API-nøkler</p>
                  <div className="space-y-3">
                    {([
                      { key: 'metaApiKey' as keyof IntegrationSettings, label: 'Meta (Facebook / Instagram)', placeholder: 'EAAxxxxx...', icon: <Facebook size={14} className="text-blue-400" /> },
                      { key: 'linkedinApiKey' as keyof IntegrationSettings, label: 'LinkedIn API Key', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx', icon: <Linkedin size={14} className="text-blue-500" /> },
                      { key: 'tiktokApiKey' as keyof IntegrationSettings, label: 'TikTok API Key', placeholder: 'tiktok_access_token_...', icon: <Music2 size={14} className="text-slate-200" /> },
                      { key: 'youtubeApiKey' as keyof IntegrationSettings, label: 'YouTube Data API Key', placeholder: 'AIzaXXXXXXXXXXXXXX', icon: <Youtube size={14} className="text-red-400" /> },
                    ]).map(({ key, label, placeholder, icon }) => (
                      <div key={key}>
                        <label className={lCls}>{label}</label>
                        <div className="flex items-center gap-2">
                          <div className="w-8 shrink-0 flex justify-center">{icon}</div>
                          <input
                            className={iCls}
                            type="password"
                            defaultValue={(brand.integrations as any)?.[key] || ''}
                            placeholder={placeholder}
                            onBlur={e => saveIntegrationKey(brand, key, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Gemini info box */}
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={15} className="text-cyan-400" />
              <span className="text-sm font-bold text-cyan-400">Gemini AI (Google)</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Gemini API-nøkkelen settes i{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">.env.local</code>{' '}
              som <code className="bg-slate-800 px-1.5 py-0.5 rounded text-cyan-300">GEMINI_API_KEY</code>.
              Den driver all AI i appen.
            </p>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span className="text-emerald-400">AI-nøkkel konfigurert og aktiv</span>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SYSTEM TAB ══════════════ */}
      {activeTab === 'system' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Language */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Languages size={18} className="text-cyan-400" />
              {t.st_lang || 'Språkvalg'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: AppLanguage.NO, label: 'Norsk', flag: '🇳🇴' },
                { id: AppLanguage.EN, label: 'English', flag: '🇬🇧' },
                { id: AppLanguage.ES, label: 'Español', flag: '🇪🇸' },
                { id: AppLanguage.DE, label: 'Deutsch', flag: '🇩🇪' },
                { id: AppLanguage.RU, label: 'Русский', flag: '🇷🇺' },
                { id: AppLanguage.FR, label: 'Français', flag: '🇫🇷' },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => handleLanguageChange(l.id)}
                  className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-3 transition-all ${
                    lang === l.id
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span> {l.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-600 flex items-center gap-1">
              <Info size={11} />
              AI vil generere rapporter, annonser og guider på valgt språk.
            </p>
          </div>

          {/* Autopilot */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <ShieldCheck size={18} className="text-cyan-400" /> Autopilot
            </h3>
            {[
              { key: 'marketPulseEnabled', label: 'Market Pulse Auto-Gen', desc: 'Generer markedsanalyser automatisk' },
              { key: 'brandIdentityGuardEnabled', label: 'Brand Identity Guard', desc: 'Beskytt merkevarestemme i AI-output' },
              { key: 'socialSyncEnabled', label: 'Social Sync', desc: 'Publiser innhold til sosiale medier' },
              { key: 'leadNurtureEnabled', label: 'Lead Nurture AI', desc: 'Automatisk oppfølging av leads' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/60 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <Toggle
                  on={!!automation[item.key as keyof AutomationSettings]}
                  onChange={() => handleAutomationToggle(item.key as keyof AutomationSettings)}
                />
              </div>
            ))}
          </div>

          {/* App info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <Zap size={18} className="text-cyan-400" /> RealtyFlow
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Versjon', value: '2.0.0' },
                { label: 'AI-motor', value: 'Gemini 2.5 Flash' },
                { label: 'Database', value: 'Supabase + localStorage' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-slate-500">
                  <span>{label}</span><span className="text-slate-300">{value}</span>
                </div>
              ))}
              <div className="flex justify-between text-slate-500">
                <span>Verdivurdering</span>
                <span className="text-emerald-400 font-semibold">Aktiv ✓</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
