
import { supabase } from "./supabase";
import { AdvisorProfile, AutomationSettings, AppLanguage } from "../types";

export interface ApiKeys {
  gemini: string;
  anthropic: string; // Beholder for eventuell fremtidig bruk
  openai: string;    // Beholder for eventuell fremtidig bruk
}

const DEFAULT_API_KEYS: ApiKeys = { gemini: '', anthropic: '', openai: '' };
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

class SettingsService {
  private apiKeys: ApiKeys = JSON.parse(localStorage.getItem('rf_api_keys') || JSON.stringify(DEFAULT_API_KEYS));
  private profile: AdvisorProfile = JSON.parse(localStorage.getItem('rf_profile') || JSON.stringify(DEFAULT_PROFILE));
  private automation: AutomationSettings = JSON.parse(localStorage.getItem('rf_automation') || JSON.stringify(DEFAULT_AUTOMATION));
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromCloud().catch(console.error);
  }

  getApiKeys(): ApiKeys { return this.apiKeys; }
  getProfile(): AdvisorProfile { return this.profile; }
  getAutomation(): AutomationSettings { return this.automation; }
  getLanguage(): AppLanguage { return this.automation.language || AppLanguage.NO; }

  updateApiKeys(keys: ApiKeys) {
    this.apiKeys = keys;
    localStorage.setItem('rf_api_keys', JSON.stringify(keys));
    this.notify();
    this.saveToCloud({ api_keys: keys }).catch(() => {});
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

  async loadFromCloud(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_settings')
      .select('api_keys, profile, automation')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'single row not found'
        console.error("Error loading settings from cloud", error);
        return;
    }

    if (data) {
        if (data.api_keys) {
            const cloudKeys = data.api_keys as Partial<ApiKeys>;
            this.apiKeys = { ...DEFAULT_API_KEYS, ...cloudKeys };
            localStorage.setItem('rf_api_keys', JSON.stringify(this.apiKeys));
        }
        if (data.profile) {
            this.profile = { ...DEFAULT_PROFILE, ...data.profile as Partial<AdvisorProfile> };
            localStorage.setItem('rf_profile', JSON.stringify(this.profile));
        }
        if (data.automation) {
            this.automation = { ...DEFAULT_AUTOMATION, ...data.automation as Partial<AutomationSettings> };
            localStorage.setItem('rf_automation', JSON.stringify(this.automation));
        }
        this.notify();
    }
  }

  async saveToCloud(settings: { api_keys?: ApiKeys, profile?: AdvisorProfile, automation?: AutomationSettings }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_settings')
      .upsert(
        { user_id: user.id, ...settings, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );
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
}

export const settingsStore = new SettingsService();
