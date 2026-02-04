
import React from 'react';
import { LayoutDashboard, Users, Map, Image as ImageIcon, FileText, Settings, Mic, Building2, Rocket, Share2, Home } from 'lucide-react';

export const COLORS = {
  primary: '#06b6d4',
  secondary: '#f97316',
  accent: '#d946ef',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  neutral: '#1e293b',
  background: '#09090b',
};

export const BRANDS = [
  { id: 'soleada', name: 'Soleada.no', type: 'Agency' },
  { id: 'zeneco', name: 'Zen Eco Homes', type: 'Development' },
  { id: 'pinoso', name: 'Pinoso Eco Life', type: 'Eco-Living' }
];

export const NAVIGATION_ITEMS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
  { label: 'Pipeline', icon: <Users size={20} />, path: '/pipeline' },
  { label: 'Inventory', icon: <Home size={20} />, path: '/inventory' },
  { label: 'Market Pulse', icon: <Map size={20} />, path: '/market' },
  { label: 'Growth Hub', icon: <Rocket size={20} />, path: '/growth' },
  { label: 'Content Studio', icon: <FileText size={20} />, path: '/content' },
  { label: 'Image Studio', icon: <ImageIcon size={20} />, path: '/studio' },
  { label: 'Assistant', icon: <Mic size={20} />, path: '/assistant' },
  { label: 'Settings', icon: <Settings size={20} />, path: '/settings' },
];

export const MOCK_LEADS = [
  {
    id: '1',
    name: 'Julian Vance',
    email: 'j.vance@example.com',
    phone: '+44 7700 900123',
    source: 'Soleada.no Web',
    status: 'NEW',
    value: 450000,
    sentiment: 88,
    urgency: 70,
    intent: 90,
    lastActivity: '1 hour ago',
    personalityType: 'Direct',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    summary: 'Seeking a luxury villa in Altea Hills. High budget, wants sea views.',
    brandId: 'soleada',
    requirements: { budget: 1500000, location: 'Altea Hills', propertyType: 'Villa' }
  },
  {
    id: '2',
    name: 'Maria Schmidt',
    email: 'm.schmidt@de.example',
    phone: '+49 151 234567',
    source: 'Pinoso Eco Life',
    status: 'QUALIFIED',
    value: 285000,
    sentiment: 95,
    urgency: 40,
    intent: 85,
    lastActivity: '3 hours ago',
    personalityType: 'Amiable',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    summary: 'Interested in sustainable living near Pinoso. Looking for a finca with solar potential.',
    brandId: 'pinoso',
    requirements: { budget: 350000, location: 'Pinoso', propertyType: 'Finca' }
  },
  {
    id: '3',
    name: 'David Brooks',
    email: 'david@zenecohomes.com',
    phone: '+47 960099965',
    source: 'Zen Eco Direct',
    status: 'VIEWING',
    value: 620000,
    sentiment: 70,
    urgency: 95,
    intent: 80,
    lastActivity: '5 hours ago',
    personalityType: 'Analytical',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    summary: 'Comparing new builds in Benidorm. Focused on energy efficiency ratings.',
    brandId: 'zeneco',
    requirements: { budget: 700000, location: 'Benidorm', propertyType: 'Apartment' }
  },
];
