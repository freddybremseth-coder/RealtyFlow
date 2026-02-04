
import { Lead, LeadStatus } from "../types";
import { MOCK_LEADS } from "../constants";
import { networkDelay } from "./supabase";

class LeadService {
  private leads: Lead[] = [...(MOCK_LEADS as any[])];
  private listeners: (() => void)[] = [];

  async getLeads(): Promise<Lead[]> {
    await networkDelay(); // Simulerer henting fra Supabase
    return this.leads;
  }

  async addLead(lead: Lead): Promise<void> {
    await networkDelay();
    this.leads = [lead, ...this.leads];
    this.notify();
    // Her ville du kjørt: await supabase.from('leads').insert(lead)
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    await networkDelay();
    this.leads = this.leads.map(l => l.id === id ? { ...l, status } : l);
    this.notify();
    // Her ville du kjørt: await supabase.from('leads').update({ status }).eq('id', id)
  }

  async removeLead(id: string): Promise<void> {
    await networkDelay();
    this.leads = this.leads.filter(l => l.id !== id);
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
