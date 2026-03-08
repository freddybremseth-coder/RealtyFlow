
import { Customer, CustomerStatus, CustomerType, EmailMessage } from '../types';
import { supabase } from './supabase';
import { Lead } from '../types';

// ─── snake_case ↔ camelCase ───────────────────────────────────────────────────

function rowToCustomer(row: Record<string, unknown>): Customer {
  return {
    id:                   String(row.id ?? ''),
    name:                 String(row.name ?? ''),
    email:                String(row.email ?? ''),
    phone:                String(row.phone ?? ''),
    nationality:          row.nationality ? String(row.nationality) : undefined,
    source:               row.source ? String(row.source) : undefined,
    status:               (row.status as CustomerStatus) ?? CustomerStatus.ACTIVE,
    type:                 (row.type as CustomerType) ?? CustomerType.BUYER,
    notes:                row.notes ? String(row.notes) : undefined,
    budget:               row.budget ? Number(row.budget) : undefined,
    location:             row.location ? String(row.location) : undefined,
    tags:                 (row.tags as string[]) ?? [],
    leadId:               row.lead_id ? String(row.lead_id) : undefined,
    brandId:              row.brand_id ? String(row.brand_id) : undefined,
    totalValue:           row.total_value ? Number(row.total_value) : undefined,
    propertiesInterested: (row.properties_interested as string[]) ?? [],
    propertiesBought:     (row.properties_bought as string[]) ?? [],
    createdAt:            String(row.created_at ?? new Date().toISOString()),
    lastContact:          String(row.last_contact ?? new Date().toISOString()),
    emails:               (row.emails as EmailMessage[]) ?? [],
  };
}

function customerToRow(c: Customer): Record<string, unknown> {
  return {
    id:                   c.id,
    name:                 c.name,
    email:                c.email,
    phone:                c.phone,
    nationality:          c.nationality ?? null,
    source:               c.source ?? null,
    status:               c.status,
    type:                 c.type,
    notes:                c.notes ?? null,
    budget:               c.budget ?? null,
    location:             c.location ?? null,
    tags:                 c.tags ?? [],
    lead_id:              c.leadId ?? null,
    brand_id:             c.brandId ?? null,
    total_value:          c.totalValue ?? 0,
    properties_interested: c.propertiesInterested ?? [],
    properties_bought:    c.propertiesBought ?? [],
    created_at:           c.createdAt,
    last_contact:         c.lastContact,
    emails:               c.emails ?? [],
  };
}

class CrmService {
  private customers: Customer[] = [];
  private listeners: (() => void)[] = [];
  private loaded = false;

  constructor() {
    this.init();
  }

  private async init() {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('crmService init error:', error.message);
      this.customers = [];
    } else {
      this.customers = (data ?? []).map(rowToCustomer);
    }
    this.loaded = true;
    this.notify();
  }

  getCustomers(): Customer[] {
    return this.customers;
  }

  async addCustomer(customer: Customer): Promise<void> {
    const row = customerToRow(customer);
    const { error } = await supabase.from('customers').insert(row);
    if (error) {
      console.error('addCustomer error:', error.message);
      return;
    }
    this.customers = [customer, ...this.customers];
    this.notify();
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
    // Build partial row with snake_case keys
    const partial: Record<string, unknown> = {};
    if (updates.name !== undefined)        partial.name = updates.name;
    if (updates.email !== undefined)       partial.email = updates.email;
    if (updates.phone !== undefined)       partial.phone = updates.phone;
    if (updates.nationality !== undefined) partial.nationality = updates.nationality;
    if (updates.source !== undefined)      partial.source = updates.source;
    if (updates.status !== undefined)      partial.status = updates.status;
    if (updates.type !== undefined)        partial.type = updates.type;
    if (updates.notes !== undefined)       partial.notes = updates.notes;
    if (updates.budget !== undefined)      partial.budget = updates.budget;
    if (updates.location !== undefined)    partial.location = updates.location;
    if (updates.tags !== undefined)        partial.tags = updates.tags;
    if (updates.totalValue !== undefined)  partial.total_value = updates.totalValue;
    if (updates.lastContact !== undefined) partial.last_contact = updates.lastContact;
    if (updates.emails !== undefined)      partial.emails = updates.emails;

    const { error } = await supabase.from('customers').update(partial).eq('id', id);
    if (error) {
      console.error('updateCustomer error:', error.message);
      return;
    }
    this.customers = this.customers.map(c => c.id === id ? { ...c, ...updates } : c);
    this.notify();
  }

  async convertFromLead(lead: Lead): Promise<Customer> {
    const customer: Customer = {
      id:                   `crm-${Date.now()}`,
      name:                 lead.name,
      email:                lead.email,
      phone:                lead.phone || '',
      source:               lead.source || 'Pipeline',
      status:               CustomerStatus.ACTIVE,
      type:                 CustomerType.BUYER,
      notes:                lead.summary || undefined,
      budget:               lead.requirements?.budget || lead.value || undefined,
      location:             lead.requirements?.location || undefined,
      tags:                 ['Fra pipeline'],
      leadId:               lead.id,
      brandId:              lead.brandId,
      createdAt:            new Date().toISOString(),
      lastContact:          new Date().toISOString(),
      totalValue:           lead.value || 0,
      propertiesInterested: [],
      propertiesBought:     [],
    };
    const exists = this.customers.some(c => c.leadId === lead.id);
    if (!exists) {
      await this.addCustomer(customer);
    }
    return customer;
  }

  async addEmailToCustomer(customerId: string, email: EmailMessage): Promise<void> {
    const customer = this.customers.find(c => c.id === customerId);
    if (!customer) return;
    const updatedEmails = [...(customer.emails ?? []), email];
    await this.updateCustomer(customerId, {
      emails: updatedEmails,
      lastContact: new Date().toISOString(),
    });
  }

  async removeCustomer(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('removeCustomer error:', error.message);
      return;
    }
    this.customers = this.customers.filter(c => c.id !== id);
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

export const crmStore = new CrmService();
