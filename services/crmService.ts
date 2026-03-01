
import { Customer, CustomerStatus, CustomerType } from '../types';

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
