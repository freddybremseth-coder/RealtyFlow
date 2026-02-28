
export enum AppLanguage {
  NO = 'no',
  EN = 'en',
  ES = 'es',
  DE = 'de',
  RU = 'ru',
  FR = 'fr'
}

export enum LeadStatus {
  NEW = 'NEW',
  QUALIFIED = 'QUALIFIED',
  VIEWING = 'VIEWING',
  NEGOTIATION = 'NEGOTIATION',
  WON = 'WON',
  LOST = 'LOST'
}

export enum MarketTheme {
  PRICING = 'pricing',
  INFRASTRUCTURE = 'infrastructure',
  LEGAL = 'legal',
  GENERAL = 'general'
}

export interface MarketAnalysis {
  id: string;
  date: string;
  location: string;
  theme: MarketTheme;
  title: string;
  text: string;
  sources: { title: string; url: string }[];
}

export interface MarketSchedule {
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  dayOfWeek: number; // 1 = Monday
  nextTheme: MarketTheme;
  lastRun?: string;
}

export interface NurtureStep {
  id: string;
  day: number;
  type: 'Email' | 'WhatsApp' | 'Call';
  subject: string;
  status: 'Pending' | 'Sent' | 'Completed';
  content?: string;
}

export interface ViewingItem {
  id: string;
  propertyTitle: string;
  propertyLocation: string;
  time: string;
  contactPerson: string;
  contactPhone: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Delayed';
  notes?: string;
  mapsUrl?: string;
}

export interface CallLog {
  id: string;
  date: string;
  time: string;
  duration: string;
  notes: string;
}

export interface EmailMessage {
  id: string;
  date: string;
  from: string;
  subject: string;
  body: string;
  isIncoming: boolean;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: LeadStatus;
  value: number;
  sentiment: number;
  urgency: number;
  intent: number;
  lastActivity: string;
  summary?: string;
  personalityType?: string;
  imageUrl?: string; 
  brandId?: string;
  viewingPlan?: ViewingItem[];
  callLogs?: CallLog[];
  nurtureSequence?: NurtureStep[];
  emails?: EmailMessage[];
  requirements?: {
    budget?: number;
    location?: string;
    style?: string;
    bedrooms?: number;
    bathrooms?: number;
    minArea?: number;
    maxPrice?: number;
    propertyType?: string;
  };
}

export interface Property {
  id: string;
  external_id?: string;
  title: string;
  price: number;
  location: string;
  region?: string;
  property_type?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  plot_size?: number;
  terrace_size?: number;
  imageUrl: string;
  gallery?: string[];
  status: 'Available' | 'Sold' | 'Under Offer';
  description?: string;
  developer?: string;
  commission?: number;
  dropbox_url?: string;
  website_url?: string;
  agent_notes?: string;
}

export interface BrandVisualStyles {
  primaryColor: string;
  secondaryColor: string;
  fontHeading: string;
  fontBody: string;
}

export interface IntegrationSettings {
  facebookActive: boolean;
  instagramActive: boolean;
  linkedinActive: boolean;
  tiktokActive: boolean;
  youtubeActive: boolean;
  pinterestActive: boolean;
  emailSyncActive: boolean;
  metaApiKey?: string;
  linkedinApiKey?: string;
  tiktokApiKey?: string;
  youtubeApiKey?: string;
  pinterestApiKey?: string;
  emailAppPassword?: string;
}

export interface Brand {
  id: string;
  name: string;
  type: string;
  description: string;
  tone: string;
  logo?: string;
  email: string;
  phone: string;
  phone2?: string;
  website: string;
  visualStyles?: BrandVisualStyles;
  integrations?: IntegrationSettings;
}

export interface AutomationSettings {
  marketPulseEnabled: boolean;
  brandIdentityGuardEnabled: boolean;
  socialSyncEnabled: boolean;
  leadNurtureEnabled: boolean;
  language?: AppLanguage;
}

export interface AdvisorProfile {
  name: string;
  imageUrl?: string;
  phone?: string;
  phone2?: string;
  location: string;
  secondaryLocation?: string;
  signature?: string;
  expertise: string[];
}

// ─── VERDIVURDERING ───────────────────────────────────────────────────────────

export type PropertyType = 'Leilighet' | 'Villa' | 'Rekkehus' | 'Finca' | 'Tomt' | 'Duplex' | 'Bungalow' | 'Annet';
export type PropertyCondition = 'Nytt / Aldri bebodd' | 'Som nytt / Renovert' | 'Godt vedlikehold' | 'Trenger noe arbeid' | 'Trenger totalrenovering';
export type PropertyOrientation = 'Sør' | 'Sør-Vest' | 'Sør-Øst' | 'Vest' | 'Øst' | 'Nord' | 'Nord-Vest' | 'Nord-Øst';
export type PropertyView = 'Havutsikt' | 'Fjellutsikt' | 'Byutsikt' | 'Basseng/hage' | 'Indre gård' | 'Ingen spesiell';
export type EnergyRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'Ukjent';
export type PoolType = 'Privat' | 'Fellesareal' | 'Ingen';

export interface ComparableProperty {
  title: string;
  price: number;
  area: number;
  pricePerSqm: number;
  bedrooms: number;
  location?: string;
  url?: string;
  source: 'Idealista' | 'CasaSafari' | 'Manuell';
}

export interface PropertyValuationData {
  // Eiendom
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  viewingDate: string;

  // Adresse
  streetAddress: string;
  postalCode: string;
  municipality: string;
  province: string;
  urbanization?: string;

  // Type og tilstand
  propertyType: PropertyType;
  condition: PropertyCondition;
  yearBuilt: string;
  lastRenovated?: string;
  energyRating: EnergyRating;

  // Størrelser
  builtArea: number;
  usefulArea?: number;
  plotSize?: number;
  terraceSize?: number;
  floor?: string;
  totalFloors?: string;

  // Rom
  bedrooms: number;
  bathrooms: number;
  extraRooms?: string;

  // Fasiliteter
  pool: PoolType;
  garage: boolean;
  parkingSpaces: number;
  hasLift: boolean;
  hasAirConditioning: boolean;
  hasSolarPanels: boolean;
  hasStorageRoom: boolean;
  hasCommunityFees: boolean;
  communityFees?: number;
  propertyTax?: number;

  // Orientering og utsikt
  orientation: PropertyOrientation;
  view: PropertyView;

  // Markedsdata
  ownerAskingPrice?: number;
  avgPricePerSqmArea?: number;
  comparables: ComparableProperty[];

  // Rådgivernotater
  agentNotes: string;
  agentStrengths: string;
  agentWeaknesses: string;
}

export interface ValuationResult {
  estimatedLow: number;
  estimatedMid: number;
  estimatedHigh: number;
  recommendedListingPrice: number;
  pricePerSqm: number;
  marketPositioning: string;
  fullReportMarkdown: string;
  propertyDescription: string;
  marketAnalysis: string;
  salesStrategy: string;
  thankYouLetter: string;
}

export interface SavedValuation {
  id: string;
  createdAt: string;
  brandId: string;
  propertyData: PropertyValuationData;
  result: ValuationResult;
}
