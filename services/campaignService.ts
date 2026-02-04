
import { Brand } from "../types";

export interface MarketingCampaign {
  id: string;
  date: string;
  brandId: string;
  headline: string;
  body: string;
  imageUrl: string | null;
  objective: string;
}

const STORAGE_KEY = 'rf_campaign_library';

class CampaignService {
  private campaigns: MarketingCampaign[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.campaigns = JSON.parse(saved);
      } catch (e) {
        this.campaigns = [];
      }
    }
  }

  getCampaigns() {
    return [...this.campaigns];
  }

  saveCampaign(campaign: MarketingCampaign) {
    this.campaigns = [campaign, ...this.campaigns];
    // Begrens til de siste 30 for å spare plass i localStorage
    if (this.campaigns.length > 30) {
      this.campaigns = this.campaigns.slice(0, 30);
    }
    this.persist();
  }

  deleteCampaign(id: string) {
    this.campaigns = this.campaigns.filter(c => c.id !== id);
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.campaigns));
    } catch (e) {
      console.error("Kunne ikke lagre kampanjebibliotek:", e);
    }
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }
}

export const campaignStore = new CampaignService();
