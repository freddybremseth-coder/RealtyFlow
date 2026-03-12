
import { supabase } from "./supabase";
import { AdvisorProfile, AutomationSettings, AppLanguage, ApiKeys, Brand } from "../types";

const DEFAULT_PROFILE: AdvisorProfile = {
  name: 'Bruker',
  location: '',
  expertise: [],
};
const DEFAULT_AUTOMATION: AutomationSettings = {
  marketPulseEnabled: true,
  brandIdentityGuardEnabled: true,
  socialSyncEnabled: false,
  leadNurtureEnabled: true,
  language: AppLanguage.NO,
};

const DEFAULT_API_KEYS: ApiKeys = {};

// Define a proper default brand for Costa Blanca HQ
const DEFAULT_BRAND: Brand = {
    id: 'costablanca',
    name: 'Costa Blanca HQ',
    type: 'Real Estate',
    description: 'Leading real estate in Costa Blanca',
    tone: 'Professional & friendly',
    logo: '/logo_costa_blanca.png', // Assuming a logo file exists
    email: 'contact@costablancahq.com',
    phone: '+34 965 000 000',
    website: 'https://costablancahq.com',
    visualStyles: {
        primaryColor: '#0D9488', // Teal
        secondaryColor: '#FFFFFF', // White
        fontHeading: 'Poppins, sans-serif',
        fontBody: 'Poppins, sans-serif',
        // Assuming you have a dark theme, let's define background colors
        backgroundColor: '#111827', // cool-gray-900
        widgetBackgroundColor: '#1F2937', // cool-gray-800
        textColor: '#FFFFFF',
    }
};


class SettingsService {
  private profile: AdvisorProfile = JSON.parse(localStorage.getItem('rf_profile') || JSON.stringify(DEFAULT_PROFILE));
  private automation: AutomationSettings = JSON.parse(localStorage.getItem('rf_automation') || JSON.stringify(DEFAULT_AUTOMATION));
  private apiKeys: ApiKeys = JSON.parse(localStorage.getItem('rf_api_keys') || JSON.stringify(DEFAULT_API_KEYS));
  private brand: Brand = JSON.parse(localStorage.getItem('rf_brand') || JSON.stringify(DEFAULT_BRAND));
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromCloud().catch(console.error);
  }

  getProfile(): AdvisorProfile { return this.profile; }
  getAutomation(): AutomationSettings { return this.automation; }
  getLanguage(): AppLanguage { return this.automation.language || AppLanguage.NO; }
  getApiKeys(): ApiKeys { return this.apiKeys; }
  getBrand(brandId: string): Brand | undefined {
    // In a real app, you might fetch this from a list of brands
    return this.brand.id === brandId ? this.brand : undefined;
  }

  updateProfile(profile: AdvisorProfile) {
    this.profile = profile;
    localStorage.setItem('rf_profile', JSON.stringify(profile));
    this.notify();
    this.saveToCloud({ profile: profile }).catch(() => {});
  }

  updateAutomation(automation: AutomationSettings) {
    this.automation = automation;
    localStorage.setItem('rf_automation', JSON.stringify(automation));
    this.notify();
    this.saveToCloud({ automation: automation }).catch(() => {});
  }

  async loadApiKeysFromCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
        .from('user_settings')
        .select('api_keys')
        .eq('user_id', user.id)

    if (error) {
        console.error("Error loading API keys from cloud", error);
        return;
    }

    if (data && data.length > 0 && data[0].api_keys) {
        this.apiKeys = { ...DEFAULT_API_KEYS, ...data[0].api_keys as ApiKeys };
        localStorage.setItem('rf_api_keys', JSON.stringify(this.apiKeys));
        this.notify();
    }
  }

  async loadFromCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('profile,automation,api_keys,brand')
      .eq('user_id', user.id);

    if (error) {
        console.error("Error loading settings from cloud", error);
        return;
    }

    if (data && data.length > 0) {
        const settings = data[0];
        let brandUpdated = false;
        if (settings.brand) {
            this.brand = { ...DEFAULT_BRAND, ...settings.brand as Brand };
            localStorage.setItem('rf_brand', JSON.stringify(this.brand));
            brandUpdated = true;
        }

        // If no brand was found in the cloud, save the default one.
        if (!brandUpdated) {
            this.brand = DEFAULT_BRAND;
            localStorage.setItem('rf_brand', JSON.stringify(this.brand));
            this.saveToCloud({ brand: this.brand }).catch(console.error);
        }

        if (settings.profile) {
            this.profile = { ...DEFAULT_PROFILE, ...settings.profile as Partial<AdvisorProfile> };
            localStorage.setItem('rf_profile', JSON.stringify(this.profile));
        }
        if (settings.automation) {
            this.automation = { ...DEFAULT_AUTOMATION, ...settings.automation as Partial<AutomationSettings> };
            localStorage.setItem('rf_automation', JSON.stringify(this.automation));
        }
        if (settings.api_keys) {
            this.apiKeys = { ...DEFAULT_API_KEYS, ...settings.api_keys as ApiKeys };
            localStorage.setItem('rf_api_keys', JSON.stringify(this.apiKeys));
        }

        this.notify();
    } else {
        // No settings row exists at all, create one with the default brand.
        this.brand = DEFAULT_BRAND;
        localStorage.setItem('rf_brand', JSON.stringify(this.brand));
        this.saveToCloud({ 
            profile: DEFAULT_PROFILE, 
            automation: DEFAULT_AUTOMATION,
            apiKeys: DEFAULT_API_KEYS,
            brand: DEFAULT_BRAND 
        }).catch(console.error);
        this.notify();
    }
  }

  async saveToCloud(settings: { profile?: AdvisorProfile, automation?: AutomationSettings, apiKeys?: ApiKeys, brand?: Brand }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, ...settings, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
      if (error) {
        console.error('Error saving to cloud', error);
      }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  updateBrand(brand: Brand) {
    this.brand = brand;
    localStorage.setItem('rf_brand', JSON.stringify(brand));
    this.notify();
    this.saveBrandToCloud(brand).catch(() => {});
  }

  async saveBrandToCloud(brand: Brand): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('brands')
      .upsert(
        { id: brand.id, ...brand, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );
  }
}

export const settingsStore = new SettingsService();
