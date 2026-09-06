import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'citizen' | 'operator' | null;

interface AuthState {
  email: string | null;
  role: Role;
  login: (email: string, role: Role) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      role: null,
      isAuthenticated: false,
      login: (email, role) => set({ email, role, isAuthenticated: true }),
      logout: () => set({ email: null, role: null, isAuthenticated: false }),
    }),
    {
      name: 'resqai-auth', // unique name
    }
  )
);
