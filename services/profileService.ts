
import { AdvisorProfile } from "../types";

const DEFAULT_PROFILE: AdvisorProfile = {
  name: 'Freddy Bremseth',
  imageUrl: '', // Legg til en URL her hvis du vil
  phone: '+47 960099965',
  phone2: '+34 600 000 000',
  location: 'Benidorm, Spain',
  secondaryLocation: 'Biar, Inland',
  signature: 'Med vennlig hilsen,\nFreddy Bremseth\nEiendomsrådgiver',
  expertise: ['Costa Blanca North', 'Inland Properties', 'Sustainable Living', 'Eco-Fincas', 'Benidorm Luxury']
};

/**
 * Henter brukerens rådgiverprofil.
 * TODO: Koble til en ekte datakilde for brukerprofiler.
 */
export const getProfile = async (): Promise<AdvisorProfile> => {
  // Foreløpig returnerer vi en hardkodet profil.
  // Senere kan dette utvides til å hente fra Supabase.
  return Promise.resolve(DEFAULT_PROFILE);
};
