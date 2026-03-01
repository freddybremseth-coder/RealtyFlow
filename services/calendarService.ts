
import { Appointment, AppointmentType, AppointmentStatus } from '../types';

const STORAGE_KEY = 'rf_calendar_appointments';

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const dayAfter = new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0];

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    title: 'Visning – Villa Las Palmas',
    type: AppointmentType.VIEWING,
    date: today,
    time: '10:00',
    duration: 60,
    location: 'Calle Mayor 12, Alicante',
    notes: 'Kunden ønsker å se bassengområdet spesielt.',
    status: AppointmentStatus.CONFIRMED,
    contactName: 'Erik Lindström',
    contactPhone: '+47 912 34 567',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a2',
    title: 'Rådgivningsmøte – Investeringsplan',
    type: AppointmentType.MEETING,
    date: today,
    time: '14:30',
    duration: 90,
    location: 'Kontor Torrevieja',
    status: AppointmentStatus.PENDING,
    contactName: 'Anna Bergström',
    contactPhone: '+46 70 234 5678',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a3',
    title: 'Verdivurdering – Leilighet Calpe',
    type: AppointmentType.VALUATION,
    date: tomorrow,
    time: '11:00',
    duration: 90,
    location: 'Av. de la Costa 45, Calpe',
    status: AppointmentStatus.CONFIRMED,
    contactName: 'Hans Müller',
    contactPhone: '+49 176 9876543',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'a4',
    title: 'Telefonmøte – Oppfølging',
    type: AppointmentType.CALL,
    date: dayAfter,
    time: '09:00',
    duration: 30,
    status: AppointmentStatus.PENDING,
    contactName: 'Nytt lead',
    createdAt: new Date().toISOString(),
  },
];

function load(): Appointment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...MOCK_APPOINTMENTS];
}

function save(appointments: Appointment[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
  } catch {}
}

class CalendarService {
  private appointments: Appointment[] = load();
  private listeners: (() => void)[] = [];

  getAppointments(): Appointment[] {
    return this.appointments;
  }

  getToday(): Appointment[] {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments
      .filter(a => a.date === today)
      .sort((a, b) => a.time.localeCompare(b.time));
  }

  getUpcoming(days = 7): Appointment[] {
    const now = new Date();
    const end = new Date(now.getTime() + days * 86400000);
    return this.appointments
      .filter(a => {
        const d = new Date(a.date);
        return d >= now && d <= end;
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }

  addAppointment(appointment: Appointment): void {
    this.appointments = [appointment, ...this.appointments];
    save(this.appointments);
    this.notify();
  }

  updateAppointment(id: string, updates: Partial<Appointment>): void {
    this.appointments = this.appointments.map(a => a.id === id ? { ...a, ...updates } : a);
    save(this.appointments);
    this.notify();
  }

  removeAppointment(id: string): void {
    this.appointments = this.appointments.filter(a => a.id !== id);
    save(this.appointments);
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

export const calendarStore = new CalendarService();
