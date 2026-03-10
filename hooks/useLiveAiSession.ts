
import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { getMarketPulse, generateROIReport } from '../services/aiService';
import { getBrand } from '../services/brandService';
import { getProfile } from '../services/profileService';
import { Brand, AdvisorProfile, MarketTheme } from '../types';

// Definerer formen på AI-funksjonene som kan kalles
interface AiFunctions {
  getMarketPulse: typeof getMarketPulse;
  generateROIReport: typeof generateROIReport;
}

// Definerer navnet på de tilgjengelige funksjonene
type FunctionName = keyof AiFunctions;

// Tilordner de faktiske funksjonene til navnene
const functions: AiFunctions = {
  getMarketPulse,
  generateROIReport,
};

export const useLiveAiSession = (brandId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const run = useCallback(async <T extends FunctionName>(
    functionName: T,
    args: Omit<Parameters<AiFunctions[T]>[0], 'brand' | 'profile'>
  ) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Bruker ikke autentisert.");

      const [brand, profile] = await Promise.all([
          getBrand(brandId),
          getProfile(),
      ]);

      if (!brand || !profile) {
          throw new Error("Kunne ikke laste merkevare eller profil.");
      }

      const func = functions[functionName];
      if (!func) {
        throw new Error(`Funksjonen '${functionName}' ble ikke funnet.`);
      }
      
      // Kaller den faktiske AI-funksjonen med alle nødvendige parametere
      // @ts-ignore - Vi vet at 'brand' og 'profile' er de siste argumentene.
      const response = await func(args, brand, profile);

      setResult(response);
      return response;

    } catch (err: any) {
      console.error(`Feil under kjøring av AI-funksjon '${functionName}':`, err);
      setError(err.message || 'En ukjent feil oppstod.');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  return { run, isLoading, error, result };
};
