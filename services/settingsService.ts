
import { Brand, AdvisorProfile, AutomationSettings } from "../types";

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
    integrations: { 
      facebookActive: false, 
      instagramActive: false, 
      linkedinActive: false, 
      tiktokActive: false,
      youtubeActive: false,
      pinterestActive: false,
      emailSyncActive: false 
    }
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
    integrations: { 
      facebookActive: false, 
      instagramActive: false, 
      linkedinActive: false, 
      tiktokActive: false,
      youtubeActive: false,
      pinterestActive: false,
      emailSyncActive: false 
    }
  },
  { 
    id: 'pinoso', 
    name: 'Pinoso Eco Life', 
    type: 'Eco-Living', 
    description: 'Sustainable Inland Living', 
    tone: 'Warm, Organic, Community-focused',
    email: 'hello@pinosoecolife.example',
    phone: '+47 000 00 000',
    phone2: '+34 900 000 003',
    website: 'https://pinosoecolife.example',
    integrations: { 
      facebookActive: false, 
      instagramActive: false, 
      linkedinActive: false, 
      tiktokActive: false,
      youtubeActive: false,
      pinterestActive: false,
      emailSyncActive: false 
    }
  }
];

const DEFAULT_PROFILE: AdvisorProfile = {
  name: 'S. Nordmann',
  imageUrl: '',
  phone: '+47 000 00 000',
  phone2: '+34 600 000 000',
  location: 'Benidorm, Spain',
  secondaryLocation: 'Biar, Inland',
  signature: 'Med vennlig hilsen,\nS. Nordmann\nEiendomsrådgiver',
  expertise: ['Costa Blanca North', 'Inland Properties', 'Sustainable Living', 'Eco-Fincas', 'Benidorm Luxury']
};

const DEFAULT_AUTOMATION: AutomationSettings = {
  marketPulseEnabled: true,
  brandIdentityGuardEnabled: true,
  socialSyncEnabled: false,
  leadNurtureEnabled: true
};

class SettingsService {
  private brands: Brand[] = JSON.parse(localStorage.getItem('rf_brands') || JSON.stringify(DEFAULT_BRANDS));
  private profile: AdvisorProfile = JSON.parse(localStorage.getItem('rf_profile') || JSON.stringify(DEFAULT_PROFILE));
  private automation: AutomationSettings = JSON.parse(localStorage.getItem('rf_automation') || JSON.stringify(DEFAULT_AUTOMATION));
  private listeners: (() => void)[] = [];

  getBrands() { return this.brands; }
  getBrand(id: string) { return this.brands.find(b => b.id === id); }
  updateBrand(updatedBrand: Brand) {
    this.brands = this.brands.map(b => b.id === updatedBrand.id ? updatedBrand : b);
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
