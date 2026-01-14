import { create } from 'zustand';

interface User {
  id: string;
  email: string;
}

interface Establishment {
  id: string;
  name: string;
  slug: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  establishment: Establishment | null;
  token: string | null;
  loadFromStorage: () => void;
  login: (token: string, user: User, establishment: Establishment) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  establishment: null,
  token: null,
  
  loadFromStorage: () => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    const establishment = localStorage.getItem('auth_establishment');
    
    if (token && user) {
      set({
        isAuthenticated: true,
        token,
        user: JSON.parse(user),
        establishment: establishment ? JSON.parse(establishment) : null,
      });
    }
  },
  
  login: (token: string, user: User, establishment: Establishment) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
    localStorage.setItem('auth_establishment', JSON.stringify(establishment));
    
    // Para compatibilidade com componentes que usam localStorage direto
    localStorage.setItem('establishmentId', establishment.id);
    localStorage.setItem('ownerId', user.id);

    set({
      isAuthenticated: true,
      token,
      user,
      establishment,
    });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_establishment');
    localStorage.removeItem('establishmentId');
    localStorage.removeItem('ownerId');
    set({ isAuthenticated: false, user: null, establishment: null, token: null });
  },
}));
