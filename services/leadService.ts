
import { Lead, LeadStatus } from "../types";
import { MOCK_LEADS } from "../constants";
import { networkDelay } from "./supabase";

const STORAGE_KEY = 'rf_leads';

function loadLeads(): Lead[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved) as Lead[];
  } catch { /* ignore */ }
  return [...(MOCK_LEADS as any[])];
}

function saveLeads(leads: Lead[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(leads)); } catch { /* ignore */ }
}

class LeadService {
  private leads: Lead[] = loadLeads();
  private listeners: (() => void)[] = [];

  async getLeads(): Promise<Lead[]> {
    await networkDelay();
    return this.leads;
  }

  async addLead(lead: Lead): Promise<void> {
    await networkDelay();
    this.leads = [lead, ...this.leads];
    saveLeads(this.leads);
    this.notify();
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    await networkDelay();
    this.leads = this.leads.map(l => l.id === id ? { ...l, status } : l);
    saveLeads(this.leads);
    this.notify();
  }

  async removeLead(id: string): Promise<void> {
    await networkDelay();
    this.leads = this.leads.filter(l => l.id !== id);
    saveLeads(this.leads);
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

export const leadStore = new LeadService();
