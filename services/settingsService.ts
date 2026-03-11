
import { supabase } from "./supabase";
import { AdvisorProfile, AutomationSettings, AppLanguage } from "../types";

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
  private profile: AdvisorProfile = JSON.parse(localStorage.getItem('rf_profile') || JSON.stringify(DEFAULT_PROFILE));
  private automation: AutomationSettings = JSON.parse(localStorage.getItem('rf_automation') || JSON.stringify(DEFAULT_AUTOMATION));
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromCloud().catch(console.error);
  }

  getProfile(): AdvisorProfile { return this.profile; }
  getAutomation(): AutomationSettings { return this.automation; }
  getLanguage(): AppLanguage { return this.automation.language || AppLanguage.NO; }

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
      .select('profile, automation')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore 'single row not found'
        console.error("Error loading settings from cloud", error);
        return;
    }

    if (data) {
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

  async saveToCloud(settings: { profile?: AdvisorProfile, automation?: AutomationSettings }): Promise<void> {
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
