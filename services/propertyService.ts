
import { Property } from "../types";

const STORAGE_KEY = 'rf_inventory_data';

class PropertyService {
  private properties: Property[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.properties = JSON.parse(saved);
      } catch (e) {
        this.properties = [];
      }
    }
  }

  parseSingleNode(node: Element, index: number): Property | null {
    try {
      const ref = node.querySelector("ref")?.textContent || node.querySelector("id")?.textContent || `redsp-${index}-${Date.now()}`;
      const price = parseInt(node.querySelector("price")?.textContent || "0");
      const type = node.querySelector("type")?.textContent || "Bolig";
      const town = node.querySelector("town")?.textContent || node.querySelector("address town")?.textContent || "Costa Blanca";
      
      let developer = node.querySelector("developer")?.textContent || "";
      if (!developer || developer.toLowerCase() === 'null') developer = node.querySelector("complex")?.textContent || "";
      if (!developer || developer.toLowerCase() === 'null') developer = node.querySelector("urbanization")?.textContent || "";

      const imageUrls: string[] = [];
      node.querySelectorAll("images image url, images url").forEach(img => {
        const url = img.textContent?.trim();
        if (url) imageUrls.push(url);
      });
      
      let desc = node.querySelector("desc no")?.textContent || node.querySelector("desc en")?.textContent || node.querySelector("desc")?.textContent || "";
      
      const built = parseFloat(node.querySelector("built_m2, built, surface_area built")?.textContent || "0");
      const plot = parseFloat(node.querySelector("plot_m2, plot, surface_area plot")?.textContent || "0");
      const terrace = parseFloat(node.querySelector("terrace_m2, terrace")?.textContent || "0");
      const beds = parseInt(node.querySelector("beds")?.textContent || "0");
      const baths = parseInt(node.querySelector("baths")?.textContent || "0");

      return {
        id: ref,
        external_id: ref,
        title: `${type} i ${town}`,
        price,
        location: town,
        bedrooms: beds,
        bathrooms: baths,
        area: built,
        plot_size: plot,
        terrace_size: terrace,
        imageUrl: imageUrls[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
        gallery: imageUrls,
        description: desc,
        developer: developer || "Zeneco Partner",
        status: 'Available'
      };
    } catch (err) {
      return null;
    }
  }

  getProperties() {
    return this.properties;
  }

  addChunk(chunk: Property[]) {
    const merged = new Map<string, Property>();
    this.properties.forEach(p => merged.set(p.external_id || p.id, p));
    chunk.forEach(p => merged.set(p.external_id || p.id, p));
    this.properties = Array.from(merged.values());
    this.save();
  }

  private save() {
    try {
      // Begrens antall boliger lagret lokalt for å unngå Quota Exceeded feil
      // 200 boliger er vanligvis trygt for localStorage kombinert med andre data
      if (this.properties.length > 200) {
        this.properties = this.properties.slice(0, 200);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.properties));
    } catch (e) {
      console.error("LocalStorage full, lagrer færre boliger...");
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.properties.slice(0, 50)));
      } catch (e2) {}
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

export const propertyStore = new PropertyService();
