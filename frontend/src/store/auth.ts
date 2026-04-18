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
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);
    }
    set({ token });
  },

  setUser: (user: any) => {
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    }
    set({ user });
  },

  setEstablishment: (est: Establishment | null) => {
    if (typeof window !== 'undefined') {
      if (est) {
        localStorage.setItem('auth_establishment', JSON.stringify(est));
        localStorage.setItem('establishment', JSON.stringify(est));
      } else {
        localStorage.removeItem('auth_establishment');
        localStorage.removeItem('establishment');
      }
    }
    set({ establishment: est });
  },

  login: (token: string, user: any, establishment?: Establishment) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
      if (establishment) {
        localStorage.setItem('auth_establishment', JSON.stringify(establishment));
        localStorage.setItem('establishment', JSON.stringify(establishment));
        localStorage.setItem('establishmentId', establishment.id);
        localStorage.setItem('establishmentSlug', establishment.slug);
      }
      if (user?.role === 'professional') {
        localStorage.setItem('professionalId', user.id);
        localStorage.removeItem('ownerId');
      } else {
        localStorage.setItem('ownerId', user.id);
        localStorage.removeItem('professionalId');
      }
    }
    set({ token, user, establishment: establishment ?? null, isAuthenticated: true });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user');
      localStorage.removeItem('auth_establishment');
      localStorage.removeItem('establishmentId');
      localStorage.removeItem('establishmentSlug');
      localStorage.removeItem('ownerId');
      localStorage.removeItem('professionalId');
    }
    set({ token: null, user: null, establishment: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const userStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
      const estStr = localStorage.getItem('auth_establishment') || localStorage.getItem('establishment');
      
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
