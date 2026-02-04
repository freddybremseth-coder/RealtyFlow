
import { MarketAnalysis, MarketSchedule, MarketTheme } from "../types";

const ANALYSES_KEY = 'rf_market_analyses';
const SCHEDULE_KEY = 'rf_market_schedule';

class MarketService {
  private analyses: MarketAnalysis[] = [];
  private schedule: MarketSchedule = {
    enabled: true,
    frequency: 'weekly',
    dayOfWeek: 1, // Mandag
    nextTheme: MarketTheme.PRICING
  };
  private listeners: (() => void)[] = [];

  constructor() {
    try {
      const savedAnalyses = localStorage.getItem(ANALYSES_KEY);
      if (savedAnalyses) {
        this.analyses = JSON.parse(savedAnalyses);
      }

      const savedSchedule = localStorage.getItem(SCHEDULE_KEY);
      if (savedSchedule) {
        this.schedule = JSON.parse(savedSchedule);
      }
    } catch (e) {
      console.error("Feil ved lasting av markedsdata fra localStorage:", e);
      this.analyses = [];
    }
  }

  getAnalyses() { 
    return [...this.analyses]; 
  }
  
  saveAnalysis(analysis: MarketAnalysis): boolean {
    console.debug("Forsøker å lagre analyse:", analysis.title);
    try {
      // Legg til i minnet først
      this.analyses = [analysis, ...this.analyses];
      
      // Begrens historikken for å unngå QuotaExceededError (50 er trygt)
      if (this.analyses.length > 50) {
        this.analyses = this.analyses.slice(0, 50);
      }
      
      // Lagre til localStorage
      localStorage.setItem(ANALYSES_KEY, JSON.stringify(this.analyses));
      
      // Varsle abonnenter
      this.notify();
      console.debug("Analyse lagret vellykket.");
      return true;
    } catch (e) {
      console.error("Kritisk feil ved lagring av analyse til localStorage:", e);
      
      // Fallback: Prøv å slette de eldste og lagre bare de 5 viktigste hvis det er fullt
      try {
        if (this.analyses.length > 5) {
          console.warn("LocalStorage full, rydder i historikken...");
          this.analyses = this.analyses.slice(0, 5);
          localStorage.setItem(ANALYSES_KEY, JSON.stringify(this.analyses));
          this.notify();
          return true;
        }
      } catch (retryError) {
        console.error("Fallback lagring feilet også.");
      }
      return false;
    }
  }

  deleteAnalysis(id: string) {
    this.analyses = this.analyses.filter(a => a.id !== id);
    try {
      localStorage.setItem(ANALYSES_KEY, JSON.stringify(this.analyses));
    } catch (e) {
      console.error("Kunne ikke oppdatere localStorage etter sletting.");
    }
    this.notify();
  }

  getSchedule() { 
    return { ...this.schedule }; 
  }
  
  updateSchedule(newSchedule: MarketSchedule) {
    this.schedule = newSchedule;
    try {
      localStorage.setItem(SCHEDULE_KEY, JSON.stringify(this.schedule));
    } catch (e) {
      console.error("Kunne ikke lagre autopilot-strategi.");
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

export const marketStore = new MarketService();
