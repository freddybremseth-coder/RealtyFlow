
import { SavedValuation } from '../types';

const STORAGE_KEY = 'rf_valuations';

class ValuationService {
  private subscribers: (() => void)[] = [];

  private notify() {
    this.subscribers.forEach(fn => fn());
  }

  subscribe(fn: () => void) {
    this.subscribers.push(fn);
    return () => { this.subscribers = this.subscribers.filter(s => s !== fn); };
  }

  getAll(): SavedValuation[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  save(valuation: SavedValuation): void {
    const all = this.getAll();
    const idx = all.findIndex(v => v.id === valuation.id);
    if (idx >= 0) {
      all[idx] = valuation;
    } else {
      all.unshift(valuation);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    this.notify();
  }

  delete(id: string): void {
    const all = this.getAll().filter(v => v.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    this.notify();
  }

  getById(id: string): SavedValuation | undefined {
    return this.getAll().find(v => v.id === id);
  }
}

export const valuationStore = new ValuationService();
