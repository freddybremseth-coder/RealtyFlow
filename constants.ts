
import { Lead, LeadStatus } from './types';

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
