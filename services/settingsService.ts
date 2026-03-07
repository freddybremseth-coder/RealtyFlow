
import { Brand, AdvisorProfile, AutomationSettings, AppLanguage } from "../types";
import { supabase } from "./supabase";

const EMPTY_INTEGRATIONS = {
  facebookActive: false,
  instagramActive: false,
  linkedinActive: false,
  tiktokActive: false,
  youtubeActive: false,
  pinterestActive: false,
  emailSyncActive: false
};

const DEFAULT_BRANDS: Brand[] = [
  {
    id: 'soleada',
    name: 'Soleada.no',
    type: 'Agency',
    description: 'Luxury International Agency',
    tone: 'Professional, Trustworthy, Exclusive',
    email: 'info@soleada.no',
    phone: '+47 000 00 000',
    phone2: '+34 900 000 001',
    website: 'https://soleada.no',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'zeneco',
    name: 'Zen Eco Homes',
    type: 'Eiendomsmegler & Utbygger',
    description: 'Spesialist på nybygg og moderne kvalitetshjem i Costa Blanca og Costa Calida, Spania.',
    tone: 'Sleek, Innovative, Precise, Trustworthy',
    email: 'freddy@zenecohomes.com',
    phone: '+47 960099965',
    phone2: '+34 900 000 002',
    website: 'https://zenecohomes.com',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'pinosoecolife',
    name: 'Pinosoecolife.com',
    type: 'Eco-Living',
    description: 'Autentisk økoliv i innlandet – bærekraftige fincaer og tomter i Pinoso-regionen.',
    tone: 'Authentic, Natural, Sustainable, Community',
    email: 'info@pinosoecolife.com',
    phone: '+47 960099965',
    phone2: '+34 900 000 003',
    website: 'https://pinosoecolife.com',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'chatgenius',
    name: 'Chatgenius.pro',
    type: 'SaaS',
    description: 'AI-drevne apper og systemer for bedrifter – chatbots, automatisering og intelligente løsninger solgt som SaaS.',
    tone: 'Innovative, Clear, Tech-Forward, Helpful',
    email: 'hello@chatgenius.pro',
    phone: '+47 960099965',
    website: 'https://chatgenius.pro',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'freddy',
    name: 'Freddybremseth.com',
    type: 'Personal Brand',
    description: 'Forfatter, investor og rådgiver – selger kompetanse innen eiendom, AI, forretningsutvikling og digital markedsføring.',
    tone: 'Personal, Expert, Inspiring, Direct',
    email: 'freddy@freddybremseth.com',
    phone: '+47 960099965',
    website: 'https://freddybremseth.com',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'donaanna',
    name: 'Donaanna.com',
    type: 'Gård & Nettbutikk',
    description: 'Olivengård i Spania – produserer og selger premium ekstra virgin olivenolje og bordoliven direkte til forbrukere.',
    tone: 'Authentic, Warm, Artisan, Mediterranean',
    email: 'hello@donaanna.com',
    phone: '+34 900 000 004',
    website: 'https://donaanna.com',
    integrations: { ...EMPTY_INTEGRATIONS }
  }
];

const DEFAULT_PROFILE: AdvisorProfile = {
  name: 'Freddy Bremseth',
  imageUrl: '',
  phone: '+47 960099965',
  phone2: '+34 600 000 000',
  location: 'Benidorm, Spain',
  secondaryLocation: 'Biar, Inland',
  signature: 'Med vennlig hilsen,\nFreddy Bremseth\nEiendomsrådgiver',
  expertise: ['Costa Blanca North', 'Inland Properties', 'Sustainable Living', 'Eco-Fincas', 'Benidorm Luxury']
};

const DEFAULT_AUTOMATION: AutomationSettings = {
  marketPulseEnabled: true,
  brandIdentityGuardEnabled: true,
  socialSyncEnabled: false,
  leadNurtureEnabled: true,
  language: AppLanguage.NO
};

export interface ApiKeys {
  anthropic: string;
  openai: string;
  gemini: string;
}

const DEFAULT_API_KEYS: ApiKeys = { anthropic: '', openai: '', gemini: '' };

class SettingsService {
  private brands: Brand[];
  private profile: AdvisorProfile = JSON.parse(localStorage.getItem('rf_profile') || JSON.stringify(DEFAULT_PROFILE));
  private automation: AutomationSettings = JSON.parse(localStorage.getItem('rf_automation') || JSON.stringify(DEFAULT_AUTOMATION));
  private apiKeys: ApiKeys = JSON.parse(localStorage.getItem('rf_api_keys') || JSON.stringify(DEFAULT_API_KEYS));
  private listeners: (() => void)[] = [];

  constructor() {
    // Canonical brand IDs — remove any saved brand not in this list (e.g. old 'pinoso')
    const canonicalIds = new Set(DEFAULT_BRANDS.map(b => b.id));
    const saved: Brand[] = JSON.parse(localStorage.getItem('rf_brands') || '[]');
    const validSaved = saved.filter(b => canonicalIds.has(b.id));
    // Merge: keep user-customised saved brands, add any missing defaults
    const merged = [...validSaved];
    for (const def of DEFAULT_BRANDS) {
      if (!merged.find(b => b.id === def.id)) merged.push(def);
    }
    this.brands = merged.length > 0 ? merged : DEFAULT_BRANDS;
  }

  getBrands() { return this.brands; }
  getBrand(id: string) { return this.brands.find(b => b.id === id); }
  updateBrand(updatedBrand: Brand) {
    this.brands = this.brands.map(b => b.id === updatedBrand.id ? updatedBrand : b);
    this.save();
  }
  addBrand(brand: Brand) {
    this.brands = [...this.brands, brand];
    this.save();
  }
  removeBrand(id: string) {
    this.brands = this.brands.filter(b => b.id !== id);
    this.save();
  }

  getProfile() { return this.profile; }
  updateProfile(updatedProfile: AdvisorProfile) {
    this.profile = updatedProfile;
    this.save();
  }

  getAutomation() { return this.automation; }
  updateAutomation(updated: AutomationSettings) {
    this.automation = updated;
    this.save();
  }

  getLanguage(): AppLanguage {
    return this.automation.language || AppLanguage.NO;
  }

  getApiKeys(): ApiKeys { return this.apiKeys; }

  updateApiKeys(keys: ApiKeys) {
    this.apiKeys = keys;
    localStorage.setItem('rf_api_keys', JSON.stringify(keys));
    this.notify();
    // Synk til sky (fire-and-forget)
    this.saveApiKeysToCloud(keys).catch(() => {});
  }

  async loadApiKeysFromCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('user_settings')
      .select('api_keys')
      .eq('user_id', user.id)
      .single();
    if (!error && data?.api_keys) {
      this.apiKeys = data.api_keys as ApiKeys;
      localStorage.setItem('rf_api_keys', JSON.stringify(this.apiKeys));
      this.notify();
    }
  }

  async saveApiKeysToCloud(keys: ApiKeys): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, api_keys: keys, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
  }

  private save() {
    localStorage.setItem('rf_brands', JSON.stringify(this.brands));
    localStorage.setItem('rf_profile', JSON.stringify(this.profile));
    localStorage.setItem('rf_automation', JSON.stringify(this.automation));
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() { this.listeners.forEach(l => l()); }
}

export const settingsStore = new SettingsService();
