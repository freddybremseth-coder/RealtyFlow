
import { Customer, CustomerStatus, CustomerType, Lead, EmailMessage } from '../types';

const STORAGE_KEY = 'rf_crm_customers';

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Erik Lindström',
    email: 'erik.lindstrom@email.com',
    phone: '+47 912 34 567',
    nationality: 'Norsk',
    source: 'Nettside',
    status: CustomerStatus.VIP,
    type: CustomerType.BUYER,
    notes: 'Interessert i villa med havutsikt. Klar til å kjøpe innen 3 måneder.',
    createdAt: '2026-01-15T10:00:00Z',
    lastContact: '2026-02-28T14:00:00Z',
    totalValue: 850000,
    budget: 900000,
    location: 'Costa Blanca Nord',
    tags: ['VIP', 'Klar kjøper'],
    propertiesInterested: [],
    propertiesBought: [],
    emails: [
      {
        id: 'em1',
        date: '2026-01-16T09:15:00Z',
        from: 'erik.lindstrom@email.com',
        subject: 'Henvendelse om villa Costa Blanca',
        body: 'Hei!\n\nJeg fant nettsiden deres og er veldig interessert i å kjøpe en villa på Costa Blanca Nord. Budsjettet mitt er rundt €900.000. Har dere noe passende?\n\nMvh, Erik',
        isIncoming: true,
      },
      {
        id: 'em2',
        date: '2026-01-17T11:30:00Z',
        from: 'freddy@soleada.no',
        subject: 'Re: Henvendelse om villa Costa Blanca',
        body: 'Hei Erik!\n\nTusen takk for din henvendelse. Vi har nettopp fått inn to fantastiske villaer som passer perfekt til ditt budsjett. Jeg sender deg prospektene i morgen.\n\nMvh, Freddy',
        isIncoming: false,
      },
      {
        id: 'em3',
        date: '2026-02-28T14:00:00Z',
        from: 'erik.lindstrom@email.com',
        subject: 'Re: Henvendelse om villa Costa Blanca',
        body: 'Hei Freddy,\n\nJeg har sett på prospektene – villa nr. 2 i Altea virker veldig interessant. Er det mulig å avtale en visning i mars?\n\nMvh, Erik',
        isIncoming: true,
      },
    ],
  },
  {
    id: 'c2',
    name: 'Anna Bergström',
    email: 'anna.b@mail.se',
    phone: '+46 70 234 5678',
    nationality: 'Svensk',
    source: 'Messe',
    status: CustomerStatus.ACTIVE,
    type: CustomerType.INVESTOR,
    notes: 'Ser etter investeringsobjekter med god leieavkastning.',
    createdAt: '2026-02-01T09:00:00Z',
    lastContact: '2026-02-25T11:00:00Z',
    totalValue: 1200000,
    budget: 1500000,
    location: 'Murcia',
    tags: ['Investor', 'Leie'],
    propertiesInterested: [],
    propertiesBought: [],
  },
  {
    id: 'c3',
    name: 'Hans Müller',
    email: 'hans.mueller@gmail.de',
    phone: '+49 176 9876543',
    nationality: 'Tysk',
    source: 'Facebook',
    status: CustomerStatus.ACTIVE,
    type: CustomerType.BUYER,
    notes: 'Pensjonist. Ønsker leilighet nær strand.',
    createdAt: '2026-01-20T08:00:00Z',
    lastContact: '2026-02-20T10:00:00Z',
    budget: 350000,
    location: 'Torrevieja',
    tags: ['Pensjonist'],
    propertiesInterested: [],
    propertiesBought: [],
  },
];

function load(): Customer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...MOCK_CUSTOMERS];
}

function save(customers: Customer[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
  } catch {}
}

class CrmService {
  private customers: Customer[] = load();
  private listeners: (() => void)[] = [];

  getCustomers(): Customer[] {
    return this.customers;
  }

  addCustomer(customer: Customer): void {
    this.customers = [customer, ...this.customers];
    save(this.customers);
    this.notify();
  }

  updateCustomer(id: string, updates: Partial<Customer>): void {
    this.customers = this.customers.map(c => c.id === id ? { ...c, ...updates } : c);
    save(this.customers);
    this.notify();
  }

  convertFromLead(lead: Lead): Customer {
    const customer: Customer = {
      id: `crm-${Date.now()}`,
      name: lead.name,
      email: lead.email,
      phone: lead.phone || '',
      source: lead.source || 'Pipeline',
      status: CustomerStatus.ACTIVE,
      type: CustomerType.BUYER,
      notes: lead.summary || undefined,
      budget: lead.requirements?.budget || lead.value || undefined,
      location: lead.requirements?.location || undefined,
      tags: ['Fra pipeline'],
      leadId: lead.id,
      brandId: lead.brandId,
      createdAt: new Date().toISOString(),
      lastContact: new Date().toISOString(),
      totalValue: lead.value || 0,
      propertiesInterested: [],
      propertiesBought: [],
    };
    // Unngå duplikat hvis allerede konvertert
    const exists = this.customers.some(c => c.leadId === lead.id);
    if (!exists) {
      this.addCustomer(customer);
    }
    return customer;
  }

  addEmailToCustomer(customerId: string, email: EmailMessage): void {
    this.customers = this.customers.map(c => {
      if (c.id !== customerId) return c;
      return {
        ...c,
        emails: [...(c.emails ?? []), email],
        lastContact: new Date().toISOString(),
      };
    });
    save(this.customers);
    this.notify();
  }

  removeCustomer(id: string): void {
    this.customers = this.customers.filter(c => c.id !== id);
    save(this.customers);
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
