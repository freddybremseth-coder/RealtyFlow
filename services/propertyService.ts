
import { Property } from "../types";
import { supabase } from "./supabase";

const STORAGE_KEY = 'rf_inventory_data';

// ─── helpers ────────────────────────────────────────────────────────────────

const txt = (node: Element, ...selectors: string[]): string => {
  for (const sel of selectors) {
    const el = node.querySelector(sel);
    if (el?.textContent?.trim()) return el.textContent.trim();
  }
  return '';
};

const num = (node: Element, ...selectors: string[]): number =>
  parseFloat(txt(node, ...selectors)) || 0;

const bool = (node: Element, ...selectors: string[]): boolean =>
  txt(node, ...selectors) === '1';

// ─── main service ────────────────────────────────────────────────────────────

class PropertyService {
  private properties: Property[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { this.properties = JSON.parse(saved); } catch { this.properties = []; }
    }
  }

  // Parses a full RedSP XML <property> node into our Property shape
  parseSingleNode(node: Element, index: number): Property | null {
    try {
      const ref      = txt(node, 'ref') || txt(node, 'id') || `redsp-${index}-${Date.now()}`;
      const price    = num(node, 'price');
      const type     = txt(node, 'type') || 'Bolig';
      const town     = txt(node, 'town') || 'Costa Blanca';

      // Multi-language titles
      const titleNo = txt(node, 'title no') || txt(node, 'title en') || `${type} i ${town}`;
      const titleEn = txt(node, 'title en') || titleNo;
      const titleEs = txt(node, 'title es') || titleNo;
      const titleDe = txt(node, 'title de') || titleNo;
      const titleFr = txt(node, 'title fr') || titleNo;
      const titleRu = txt(node, 'title ru') || titleNo;

      // Multi-language descriptions
      const descNo = txt(node, 'desc no') || txt(node, 'desc en') || '';
      const descEn = txt(node, 'desc en') || descNo;
      const descEs = txt(node, 'desc es') || descNo;
      const descDe = txt(node, 'desc de') || descNo;
      const descFr = txt(node, 'desc fr') || descNo;
      const descRu = txt(node, 'desc ru') || descNo;

      // Images
      const allImages: string[] = [];
      const floorplans: string[] = [];
      node.querySelectorAll('images image').forEach(img => {
        const url = img.querySelector('url')?.textContent?.trim();
        if (!url) return;
        const tags = Array.from(img.querySelectorAll('tag')).map(t => t.textContent?.trim());
        if (tags.includes('floorplan')) floorplans.push(url);
        else allImages.push(url);
      });
      // fallback: bare <images><url>
      if (allImages.length === 0) {
        node.querySelectorAll('images url').forEach(u => {
          const url = u.textContent?.trim();
          if (url) allImages.push(url);
        });
      }

      // Features list
      const features: string[] = [];
      node.querySelectorAll('features feature').forEach(f => {
        const v = f.textContent?.trim();
        if (v) features.push(v);
      });

      // Developer / complex name
      let developer = txt(node, 'developer');
      if (!developer || developer.toLowerCase() === 'null') developer = txt(node, 'complex');
      if (!developer || developer.toLowerCase() === 'null') developer = txt(node, 'urbanization');
      if (!developer || developer.toLowerCase() === 'null') developer = 'Zeneco Partner';

      const imageUrl = allImages[0] || floorplans[0] ||
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';

      return {
        id:           ref,
        external_id:  ref,
        // RedSP specific
        redsp_id:     txt(node, 'id'),
        ref,
        date_updated: txt(node, 'date') || undefined,
        // Price
        price,
        currency:     txt(node, 'currency') || 'EUR',
        price_freq:   txt(node, 'price_freq') || 'sale',
        part_ownership: bool(node, 'part_ownership'),
        leasehold:    bool(node, 'leasehold'),
        new_build:    bool(node, 'new_build'),
        // Type & status
        propertyType: type,
        status:       'Available',
        // Location
        location:     town,
        town,
        province:     txt(node, 'province'),
        costa:        txt(node, 'costa'),
        country:      txt(node, 'country') || 'Spain',
        latitude:     num(node, 'location latitude'),
        longitude:    num(node, 'location longitude'),
        location_detail: txt(node, 'location_detail'),
        postal_code:  txt(node, 'postal_code'),
        // Details
        bedrooms:     parseInt(txt(node, 'beds')) || 0,
        bathrooms:    parseInt(txt(node, 'baths')) || 0,
        pool:         bool(node, 'pool'),
        // Area
        area:         num(node, 'surface_area built', 'built_m2', 'built'),
        plot_size:    num(node, 'surface_area plot', 'plot_m2', 'plot'),
        terrace_size: num(node, 'terrace_m2', 'terrace'),
        solarium_m2:  num(node, 'solarium_area_m2'),
        usable_m2:    num(node, 'usable_living_area_m2'),
        distance_to_beach_m: parseInt(txt(node, 'distance_to_beach_m')) || undefined,
        // Energy
        energy_consumption: txt(node, 'energy_rating consumption'),
        energy_emissions:   txt(node, 'energy_rating emissions'),
        // Titles
        title:    titleNo,
        title_no: titleNo,
        title_en: titleEn,
        title_es: titleEs,
        title_de: titleDe,
        title_fr: titleFr,
        title_ru: titleRu,
        // Descriptions
        description: descNo,
        desc_no: descNo,
        desc_en: descEn,
        desc_es: descEs,
        desc_de: descDe,
        desc_fr: descFr,
        desc_ru: descRu,
        // Features & images
        features,
        imageUrl,
        gallery:       allImages,
        floorplan_urls: floorplans,
        developer,
      } as any;
    } catch (err) {
      return null;
    }
  }

  getProperties() { return this.properties; }

  // Add a chunk locally + upsert to Supabase in background
  addChunk(chunk: Property[]) {
    const merged = new Map<string, Property>();
    this.properties.forEach(p => merged.set((p as any).ref || p.external_id || p.id, p));
    chunk.forEach(p => merged.set((p as any).ref || p.external_id || p.id, p));
    this.properties = Array.from(merged.values());
    this.save();
    this.upsertToSupabase(chunk);
  }

  private async upsertToSupabase(chunk: Property[]) {
    try {
      const rows = chunk.map((p: any) => ({
        redsp_id:          p.redsp_id         || null,
        ref:               p.ref              || p.external_id,
        date_updated:      p.date_updated     || null,
        price:             p.price            || 0,
        currency:          p.currency         || 'EUR',
        price_freq:        p.price_freq       || 'sale',
        part_ownership:    p.part_ownership   || false,
        leasehold:         p.leasehold        || false,
        new_build:         p.new_build        || false,
        property_type:     p.propertyType     || null,
        status:            p.status           || 'Available',
        town:              p.town             || null,
        province:          p.province         || null,
        costa:             p.costa            || null,
        country:           p.country          || 'Spain',
        latitude:          p.latitude         || null,
        longitude:         p.longitude        || null,
        location_detail:   p.location_detail  || null,
        postal_code:       p.postal_code      || null,
        bedrooms:          p.bedrooms         || 0,
        bathrooms:         p.bathrooms        || 0,
        pool:              p.pool             || false,
        built_m2:          p.area             || 0,
        plot_m2:           p.plot_size        || 0,
        terrace_m2:        p.terrace_size     || 0,
        solarium_m2:       p.solarium_m2      || 0,
        usable_m2:         p.usable_m2        || 0,
        distance_to_beach_m: p.distance_to_beach_m || null,
        energy_consumption: p.energy_consumption || null,
        energy_emissions:   p.energy_emissions   || null,
        title_no:          p.title_no         || p.title || null,
        title_en:          p.title_en         || null,
        title_es:          p.title_es         || null,
        title_de:          p.title_de         || null,
        title_fr:          p.title_fr         || null,
        title_ru:          p.title_ru         || null,
        desc_no:           p.desc_no          || p.description || null,
        desc_en:           p.desc_en          || null,
        desc_es:           p.desc_es          || null,
        desc_de:           p.desc_de          || null,
        desc_fr:           p.desc_fr          || null,
        desc_ru:           p.desc_ru          || null,
        features:          p.features         || [],
        image_url:         p.imageUrl         || null,
        gallery:           p.gallery          || [],
        floorplan_urls:    p.floorplan_urls   || [],
        developer:         p.developer        || null,
        updated_at:        new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('properties')
        .upsert(rows, { onConflict: 'ref', ignoreDuplicates: false });

      if (error) console.error('Supabase upsert feil:', error.message);
    } catch (err) {
      console.error('Supabase upsert exception:', err);
    }
  }

  // Load all properties from Supabase (replaces local cache)
  async loadFromSupabase(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(2000);

      if (error) throw error;
      if (!data || data.length === 0) return;

      this.properties = data.map((r: any) => ({
        id:            r.ref || r.id,
        external_id:   r.ref,
        ref:           r.ref,
        redsp_id:      r.redsp_id,
        title:         r.title_no || r.title_en || `${r.property_type} i ${r.town}`,
        title_no:      r.title_no,
        title_en:      r.title_en,
        title_es:      r.title_es,
        title_de:      r.title_de,
        title_fr:      r.title_fr,
        title_ru:      r.title_ru,
        price:         r.price,
        currency:      r.currency,
        price_freq:    r.price_freq,
        new_build:     r.new_build,
        propertyType:  r.property_type,
        location:      r.town,
        town:          r.town,
        province:      r.province,
        costa:         r.costa,
        country:       r.country,
        latitude:      r.latitude,
        longitude:     r.longitude,
        location_detail: r.location_detail,
        postal_code:   r.postal_code,
        bedrooms:      r.bedrooms,
        bathrooms:     r.bathrooms,
        pool:          r.pool,
        area:          r.built_m2,
        plot_size:     r.plot_m2,
        terrace_size:  r.terrace_m2,
        solarium_m2:   r.solarium_m2,
        usable_m2:     r.usable_m2,
        distance_to_beach_m: r.distance_to_beach_m,
        energy_consumption: r.energy_consumption,
        energy_emissions:   r.energy_emissions,
        description:   r.desc_no || r.desc_en || '',
        desc_no:       r.desc_no,
        desc_en:       r.desc_en,
        desc_es:       r.desc_es,
        desc_de:       r.desc_de,
        desc_fr:       r.desc_fr,
        desc_ru:       r.desc_ru,
        features:      r.features || [],
        imageUrl:      r.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
        gallery:       r.gallery || [],
        floorplan_urls: r.floorplan_urls || [],
        developer:     r.developer,
        status:        r.status,
      }));

      this.save();
      this.notify();
    } catch (err) {
      console.error('loadFromSupabase feil:', err);
    }
  }

  private save() {
    try {
      const toSave = this.properties.length > 200 ? this.properties.slice(0, 200) : this.properties;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.properties.slice(0, 50))); } catch {}
    }
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  private notify() { this.listeners.forEach(l => l()); }
}

export const propertyStore = new PropertyService();
