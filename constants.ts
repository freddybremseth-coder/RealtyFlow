
import { Lead, LeadStatus, Brand } from './types';

export const COLORS = {
  primary: '#06b6d4',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    source: 'Website',
    status: LeadStatus.NEW,
    value: 50000,
    sentiment: 0.8,
    urgency: 0.9,
    intent: 0.7,
    lastActivity: '2023-10-27T10:00:00Z',
  },
];

const EMPTY_INTEGRATIONS = {
  facebookActive: false,
  instagramActive: false,
  linkedinActive: false,
  tiktokActive: false,
  youtubeActive: false,
  pinterestActive: false,
  emailSyncActive: false
};

export const BRANDS: Brand[] = [
  {
    id: 'soleada',
    name: 'Soleada.no',
    type: 'Agency',
    description: 'Luxury International Agency',
    tone: 'Professional, Trustworthy, Exclusive',
    email: 'info@soleada.no',
    phone: '+47 000 00 000',
    phone2: '+34 900 000 001',
    website: 'https://soleada.no',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'zeneco',
    name: 'Zen Eco Homes',
    type: 'Eiendomsmegler & Utbygger',
    description: 'Spesialist på nybygg og moderne kvalitetshjem i Costa Blanca og Costa Calida, Spania.',
    tone: 'Sleek, Innovative, Precise, Trustworthy',
    email: 'freddy@zenecohomes.com',
    phone: '+47 960099965',
    phone2: '+34 900 000 002',
    website: 'https://zenecohomes.com',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'pinosoecolife',
    name: 'Pinoso Eco Life',
    type: 'Eco-Living',
    description: 'Autentisk økoliv i innlandet – bærekraftige fincaer og tomter i Pinoso-regionen.',
    tone: 'Authentic, Natural, Sustainable, Community',
    email: 'info@pinosoecolife.com',
    phone: '+47 960099965',
    phone2: '+34 900 000 003',
    website: 'https://pinosoecolife.com',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'freddybremseth',
    name: 'FreddyBremseth.com',
    type: 'Rådgiver',
    description: 'Personlig branding for Freddy Bremseth.',
    tone: 'Personlig, Profesjonell, Direkte',
    email: 'freddy@freddybremseth.com',
    phone: '+47 960099965',
    phone2: '',
    website: 'https://freddybremseth.com',
    integrations: { ...EMPTY_INTEGRATIONS }
  },
  {
    id: 'chatgenius',
    name: 'ChatGenius.pro',
    type: 'Teknologi',
    description: 'AI-drevne chat-løsninger for bedrifter.',
    tone: 'Innovativ, Teknisk, Effektiv',
    email: 'contact@chatgenius.pro',
    phone: '',
    phone2: '',
    website: 'https://chatgenius.pro',
    integrations: { ...EMPTY_INTEGRATIONS }
  }
];
