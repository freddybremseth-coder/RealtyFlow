/**
 * webhookService.ts
 * Poller Business Hub API for innkommende leads fra webhooks
 * og konverterer dem til RealtyFlow's Lead-format.
 */

import { Lead, LeadStatus } from '../types';

// Business Hub kjører lokalt på port 3000 (eller via env)
const BUSINESS_HUB_URL =
  (import.meta as any).env?.VITE_BUSINESS_HUB_URL ?? 'http://localhost:3000';

const POLL_INTERVAL_MS = 30_000; // 30 sekunder
const STORAGE_KEY = 'rf_webhook_last_sync';

export interface WebhookLead {
  id: string;
  createdAt: string;
  kilde: 'real-estate' | 'ecommerce';
  status: string;
  navn: string;
  epost?: string;
  telefon?: string;
  firma?: string;
  eiendomType?: string;
  budsjett?: number;
  lokasjon?: string;
  produkt?: string;
  mengde?: number;
  melding?: string;
  kundeId?: string;
}

/** Konverter fra Business Hub format til RealtyFlow Lead */
function toRealtyFlowLead(wl: WebhookLead): Lead {
  const isRealEstate = wl.kilde === 'real-estate';

  return {
    id: `wh-${wl.id}`,
    name: wl.navn,
    email: wl.epost ?? '',
    phone: wl.telefon ?? '',
    source: isRealEstate ? 'Eiendom Webhook' : 'E-commerce Webhook',
    status: LeadStatus.NEW,
    value: wl.budsjett ?? 0,
    sentiment: 60,
    urgency: 50,
    intent: 55,
    lastActivity: new Date(wl.createdAt).toLocaleDateString('no-NO'),
    summary: buildSummary(wl),
    brandId: isRealEstate ? 'soleada' : 'zeneco',
    emails: [],
    requirements: isRealEstate
      ? {
          budget: wl.budsjett,
          location: wl.lokasjon,
          propertyType: wl.eiendomType,
        }
      : {
          budget: wl.budsjett,
        },
  };
}

function buildSummary(wl: WebhookLead): string {
  const parts: string[] = [];
  if (wl.kilde === 'real-estate') {
    if (wl.eiendomType) parts.push(`Søker ${wl.eiendomType}`);
    if (wl.lokasjon) parts.push(`i ${wl.lokasjon}`);
    if (wl.budsjett) parts.push(`• Budsjett: €${wl.budsjett.toLocaleString('no-NO')}`);
  } else {
    if (wl.produkt) parts.push(`Produkt: ${wl.produkt}`);
    if (wl.mengde) parts.push(`(${wl.mengde} stk)`);
    if (wl.firma) parts.push(`• Firma: ${wl.firma}`);
  }
  if (wl.melding) parts.push(`\n"${wl.melding}"`);
  return parts.join(' ') || 'Innkommende webhook-lead';
}

type Listener = (leads: WebhookLead[]) => void;

class WebhookService {
  private listeners: Listener[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastSync: string | null = null;
  private isPolling = false;

  constructor() {
    this.lastSync = localStorage.getItem(STORAGE_KEY);
  }

  /** Start automatisk polling */
  startPolling(): void {
    if (this.intervalId) return;
    this.fetchNew(); // umiddelbar første henting
    this.intervalId = setInterval(() => this.fetchNew(), POLL_INTERVAL_MS);
  }

  /** Stopp polling */
  stopPolling(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Manuell henting */
  async fetchNew(): Promise<WebhookLead[]> {
    if (this.isPolling) return [];
    this.isPolling = true;
    try {
      const url = new URL(`${BUSINESS_HUB_URL}/api/webhooks/recent`);
      if (this.lastSync) url.searchParams.set('since', this.lastSync);
      url.searchParams.set('limit', '50');

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: { leads: WebhookLead[]; timestamp: string } = await res.json();

      if (data.leads.length > 0) {
        this.lastSync = data.timestamp;
        localStorage.setItem(STORAGE_KEY, data.timestamp);
        this.notify(data.leads);
      }
      return data.leads;
    } catch {
      // Feil (f.eks. business-hub ikke startet) ignoreres stille
      return [];
    } finally {
      this.isPolling = false;
    }
  }

  /** Hent alle leads (ikke bare nye) */
  async fetchAll(limit = 50): Promise<WebhookLead[]> {
    try {
      const url = new URL(`${BUSINESS_HUB_URL}/api/webhooks/recent`);
      url.searchParams.set('limit', String(limit));
      const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.leads ?? [];
    } catch {
      return [];
    }
  }

  /** Sjekk om Business Hub er tilgjengelig */
  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${BUSINESS_HUB_URL}/api/webhooks/recent?limit=1`, {
        signal: AbortSignal.timeout(3000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Konverter og legg inn i RealtyFlow Lead-format */
  toRealtyFlowLead(wl: WebhookLead): Lead {
    return toRealtyFlowLead(wl);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(leads: WebhookLead[]): void {
    this.listeners.forEach(l => l(leads));
  }
}

export const webhookService = new WebhookService();
