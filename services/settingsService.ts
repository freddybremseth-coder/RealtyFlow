
import { supabase } from "./supabase";

export interface ApiKeys {
  gemini: string;
  anthropic: string; // Beholder for eventuell fremtidig bruk
  openai: string;    // Beholder for eventuell fremtidig bruk
}

const DEFAULT_API_KEYS: ApiKeys = { gemini: '', anthropic: '', openai: '' };

class SettingsService {
  private apiKeys: ApiKeys = JSON.parse(localStorage.getItem('rf_api_keys') || JSON.stringify(DEFAULT_API_KEYS));
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadApiKeysFromCloud().catch(console.error);
  }

  getApiKeys(): ApiKeys { 
    return this.apiKeys; 
  }

  getApiKey(key: keyof ApiKeys): string {
      return this.apiKeys[key];
  }

  updateApiKeys(keys: ApiKeys) {
    this.apiKeys = keys;
    localStorage.setItem('rf_api_keys', JSON.stringify(keys));
    this.notify();
    // Synk til sky i bakgrunnen
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
      // Forsikre oss om at alle nøkler er til stede, selv om de er tomme
      const cloudKeys = data.api_keys as Partial<ApiKeys>;
      this.apiKeys = {
        ...DEFAULT_API_KEYS,
        ...cloudKeys,
      };
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
