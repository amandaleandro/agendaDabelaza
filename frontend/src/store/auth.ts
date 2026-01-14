import { create } from 'zustand';

interface Establishment {
  id: string;
  name: string;
  slug: string;
}

export interface AuthState {
  token: string | null;
  user: any | null;
  establishment: Establishment | null;
  isAuthenticated: boolean;
  setToken: (token: string) => void;
  setUser: (user: any) => void;
  setEstablishment: (est: Establishment | null) => void;
  login: (token: string, user: any, establishment?: Establishment) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  establishment: null,
  isAuthenticated: false,

  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ token });
  },

  setUser: (user: any) => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
  },

  setEstablishment: (est: Establishment | null) => {
    if (typeof window !== 'undefined') {
      if (est) {
        localStorage.setItem('establishment', JSON.stringify(est));
      } else {
        localStorage.removeItem('establishment');
      }
    }
    set({ establishment: est });
  },

  login: (token: string, user: any, establishment?: Establishment) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (establishment) {
        localStorage.setItem('establishment', JSON.stringify(establishment));
      }
    }
    set({ token, user, establishment: establishment ?? null, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ token: null, user: null, establishment: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const estStr = localStorage.getItem('establishment');
      
      let user = null;
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          user = JSON.parse(userStr);
        } catch (e) {
          console.error('Erro ao parsear user do localStorage:', e);
          user = null;
        }
      }
      let establishment: Establishment | null = null;
      if (estStr && estStr !== 'undefined' && estStr !== 'null') {
        try {
          establishment = JSON.parse(estStr);
        } catch (e) {
          console.error('Erro ao parsear establishment do localStorage:', e);
          establishment = null;
        }
      }
      
      set({ token, user, establishment, isAuthenticated: !!token });
    }
  },
}));
