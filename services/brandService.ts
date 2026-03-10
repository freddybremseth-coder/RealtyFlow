
import { Brand } from "../types";
import { supabase } from "./supabase";

/**
 * Henter alle merkevarer for den gjeldende brukeren.
 * TODO: Implementer full CRUD-funksjonalitet og autorisasjon.
 */
export const getBrands = async (): Promise<Brand[]> => {
  console.log("Henter merkevarer fra databasen...");
  const { data, error } = await supabase
    .from('brands')
    .select('*');

  if (error) {
    console.error("Feil ved henting av merkevarer:", error);
    // Returner en tom liste eller standardmerker ved feil
    return []; 
  }

  console.log(`Fant ${data.length} merkevarer.`);
  // Mapper om fra snake_case (database) til camelCase (frontend)
  return data.map(brand => ({
    id: brand.id,
    name: brand.name,
    type: brand.type,
    description: brand.description,
    tone: brand.tone,
    email: brand.email,
    phone: brand.phone,
    phone2: brand.phone2,
    website: brand.website,
    // Standardverdier for integrasjoner, siden dette ikke er i databasen enda
    integrations: {
      facebookActive: false,
      instagramActive: false,
      linkedinActive: false,
      tiktokActive: false,
      youtubeActive: false,
      pinterestActive: false,
      emailSyncActive: false
    }
  }));
};

/**
 * Henter én spesifikk merkevare basert på ID.
 */
export const getBrand = async (id: string): Promise<Brand | null> => {
    const brands = await getBrands();
    return brands.find(b => b.id === id) || null;
};
