
import { Lead, LeadStatus } from "../types";
import { supabase } from "./supabase";

// ─── snake_case ↔ camelCase ───────────────────────────────────────────────────

function rowToLead(row: Record<string, unknown>): Lead {
  // Kombiner first_name + last_name → name, fall back til name-kolonnen
  const firstName = row.first_name ? String(row.first_name).trim() : '';
  const lastName  = row.last_name  ? String(row.last_name).trim()  : '';
  const fullName  = firstName || lastName
    ? [firstName, lastName].filter(Boolean).join(' ')
    : String(row.name ?? '');

  return {
    id:              String(row.id ?? ''),
    name:            fullName,
    email:           String(row.email ?? ''),
    phone:           String(row.phone ?? ''),
    source:          String(row.source ?? ''),
    status:          (row.status as LeadStatus) ?? LeadStatus.NEW,
    value:           Number(row.value ?? 0),
    sentiment:       Number(row.sentiment ?? 50),
    urgency:         Number(row.urgency ?? 50),
    intent:          Number(row.intent ?? 50),
    lastActivity:    String(row.last_activity ?? ''),
    summary:         row.summary ? String(row.summary) : undefined,
    brandId:         row.brand_id ? String(row.brand_id) : undefined,
    requirements:    (row.requirements as Lead['requirements']) ?? undefined,
    emails:          (row.emails as Lead['emails']) ?? [],
    imageUrl:        row.image_url ? String(row.image_url) : undefined,
  };
}

function leadToRow(lead: Lead): Record<string, unknown> {
  const parts = lead.name?.trim().split(/\s+/) ?? [];
  const firstName = parts.length > 1 ? parts.slice(0, -1).join(' ') : parts[0] ?? '';
  const lastName  = parts.length > 1 ? parts[parts.length - 1] : '';

  return {
    id:            lead.id,
    name:          lead.name,
    first_name:    firstName,
    last_name:     lastName,
    email:         lead.email,
    phone:         lead.phone,
    source:        lead.source,
    status:        lead.status,
    value:         lead.value ?? 0,
    sentiment:     lead.sentiment ?? 50,
    urgency:       lead.urgency ?? 50,
    intent:        lead.intent ?? 50,
    last_activity: lead.lastActivity ?? '',
    summary:       lead.summary ?? null,
    brand_id:      lead.brandId ?? '',
    requirements:  lead.requirements ?? {},
    emails:        lead.emails ?? [],
  };
}

class LeadService {
  private leads: Lead[] = [];
  private listeners: (() => void)[] = [];
  private loaded = false;

  constructor() {
    this.init();
  }

  private async init() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('leadService init error:', error.message);
      this.leads = [];
    } else {
      this.leads = (data ?? []).map(rowToLead);
    }
    this.loaded = true;
    this.notify();
  }

  async getLeads(): Promise<Lead[]> {
    // If not yet loaded, wait for init to complete
    if (!this.loaded) {
      await new Promise<void>(resolve => {
        const unsub = this.subscribe(() => {
          if (this.loaded) { unsub(); resolve(); }
        });
      });
    }
    return this.leads;
  }

  async addLead(lead: Lead): Promise<void> {
    const row = leadToRow(lead);
    const { error } = await supabase.from('leads').insert(row);
    if (error) {
      throw new Error(error.message);
    }
    this.leads = [lead, ...this.leads];
    this.notify();
  }

  async updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
    const { error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id);
    if (error) {
      console.error('updateLeadStatus error:', error.message);
      return;
    }
    this.leads = this.leads.map(l => l.id === id ? { ...l, status } : l);
    this.notify();
  }

  async removeLead(id: string): Promise<void> {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) {
      console.error('removeLead error:', error.message);
      return;
    }
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
