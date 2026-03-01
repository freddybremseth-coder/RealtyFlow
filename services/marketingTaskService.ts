
import { MarketingTask, MarketingTaskStatus } from '../types';

const STORAGE_KEY = 'rf_marketing_tasks';

const MOCK_TASKS: MarketingTask[] = [
  {
    id: 'mt1',
    title: 'Instagram-innlegg – Villa Las Palmas',
    content: 'Lag 3 bilder med tekst om den nye villaen. Fokus på pool og havutsikt.',
    platform: 'Instagram',
    status: MarketingTaskStatus.IN_PROGRESS,
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    tags: ['Soleada', 'Villa'],
  },
  {
    id: 'mt2',
    title: 'Facebook-annonse – Investeringsguide',
    content: 'Kjør annonse mot nordiske investorer. Bruk ROI-tall fra siste rapport.',
    platform: 'Facebook',
    status: MarketingTaskStatus.PENDING,
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    tags: ['Zeneco', 'Investor'],
  },
  {
    id: 'mt3',
    title: 'LinkedIn-artikkel – Markedsoppdatering Q1',
    content: 'Skriv fagartikkel om prisutviklingen på Costa Blanca. Ca. 800 ord.',
    platform: 'LinkedIn',
    status: MarketingTaskStatus.PENDING,
    priority: 'MEDIUM',
    createdAt: new Date().toISOString(),
    tags: ['Faglig'],
  },
  {
    id: 'mt4',
    title: 'E-postkampanje – Nyhetsbrev mars',
    content: 'Send nyhetsbrev til eksisterende kundeliste. Inkluder 3 utvalgte eiendommer.',
    platform: 'E-post',
    status: MarketingTaskStatus.REVIEW,
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    tags: ['Nyhetsbrev'],
  },
  {
    id: 'mt5',
    title: 'TikTok-video – Vise oss på visning',
    content: 'Short-form video fra visning. Naturlig og autentisk tone.',
    platform: 'TikTok',
    status: MarketingTaskStatus.DONE,
    priority: 'LOW',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    tags: ['Video'],
  },
];

function load(): MarketingTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [...MOCK_TASKS];
}

function save(tasks: MarketingTask[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {}
}

class MarketingTaskService {
  private tasks: MarketingTask[] = load();
  private listeners: (() => void)[] = [];

  getTasks(): MarketingTask[] {
    return this.tasks;
  }

  addTask(task: MarketingTask): void {
    this.tasks = [task, ...this.tasks];
    save(this.tasks);
    this.notify();
  }

  updateTask(id: string, updates: Partial<MarketingTask>): void {
    this.tasks = this.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    save(this.tasks);
    this.notify();
  }

  updateTaskStatus(id: string, status: MarketingTaskStatus): void {
    this.tasks = this.tasks.map(t => t.id === id ? { ...t, status } : t);
    save(this.tasks);
    this.notify();
  }

  removeTask(id: string): void {
    this.tasks = this.tasks.filter(t => t.id !== id);
    save(this.tasks);
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

export const marketingTaskStore = new MarketingTaskService();
