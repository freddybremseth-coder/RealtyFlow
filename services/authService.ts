
import { supabase } from "./supabase";

const AUTH_KEY = 'rf_auth_session';

export interface UserSession {
  email: string;
  isLoggedIn: boolean;
  loginTime: number;
}

class AuthService {
  private session: UserSession | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      this.session = JSON.parse(saved);
    }
  }

  async login(email: string, pass: string): Promise<boolean> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error || !data.user) return false;

    this.session = {
      email: data.user.email ?? email,
      isLoggedIn: true,
      loginTime: Date.now()
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(this.session));
    this.notify();
    return true;
  }

  async logout() {
    await supabase.auth.signOut();
    this.session = null;
    localStorage.removeItem(AUTH_KEY);
    this.notify();
  }

  isAuthenticated(): boolean {
    return this.session?.isLoggedIn || false;
  }

  getUserEmail(): string | null {
    return this.session?.email || null;
  }

  async resetPassword(email: string): Promise<void> {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`
    });
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

export const authStore = new AuthService();
