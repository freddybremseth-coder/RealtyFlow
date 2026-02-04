
// Merk: Du må legge til dine egne Supabase URL og Key i miljøvariabler når du deployer.
// Siden vi kjører i en demo-kontekst, eksporterer vi en struktur som er klar for integrasjon.

export const SUPABASE_CONFIG = {
  url: process.env.SUPABASE_URL || 'https://din-prosjekt-id.supabase.co',
  anonKey: process.env.SUPABASE_ANON_KEY || 'din-anon-key'
};

// Dette er en placeholder for @supabase/supabase-js som du installerer via npm/esm
export const isCloudConnected = !!process.env.SUPABASE_URL;

// Hjelpefunksjon for å simulere nettverksforsinkelse i demo-modus
export const networkDelay = () => new Promise(resolve => setTimeout(resolve, 600));
