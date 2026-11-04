'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest, ApiError, SESSION_INVALIDATED_EVENT } from '../utils/api';

interface User {
  id?: string | number;
  nome?: string;
  email?: string;
  cep?: string;
  cpf?: string;
  cuidador?: boolean;
  dataNasc?: Date;
  senha?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  loading: boolean;
  getUserDisplayName: () => string;
}

// Utility function to format user name consistently
const formatUserDisplayName = (user: User | null): string => {
  if (!user) return 'Usuário';

  if (typeof user.nome === 'string' && user.nome.trim()) {
    return user.nome.split(' ')[0];
  }

  // If we have an email, use the part before '@'
  if (typeof user.email === 'string' && user.email.includes('@')) {
    return user.email.split('@')[0];
  }

  return 'Usuário';
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Each explicit login/logout revokes outstanding restoration responses.
  const generation = useRef(0);

  useEffect(() => {
    const invalidate = () => {
      generation.current++;
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      router.push('/login');
    };
    window.addEventListener(SESSION_INVALIDATED_EVENT, invalidate);
    return () => window.removeEventListener(SESSION_INVALIDATED_EVENT, invalidate);
  }, [router]);

  // Each explicit login/logout revokes outstanding restoration responses.

  useEffect(() => {
    let active = true;
    const version = generation.current;
    const token = localStorage.getItem('access_token');
    const current = () => active && generation.current === version &&
      localStorage.getItem('access_token') === token;
    const checkAuth = async () => {
      try {
        if (!token) return;
        const response = await apiRequest<{ data: User }>('usuario/me', {
          method: 'GET', onUnauthorized: 'throw',
        });
        if (!current()) return;
        if (!response.data || !response.data.id) throw new Error('Perfil inválido');
        setUser(response.data);
        localStorage.setItem('user_data', JSON.stringify(response.data));
        setIsAuthenticated(true);
      } catch (error) {
        if (!current()) return;
        setIsAuthenticated(false);
        setUser(null);
        // Network/server failures leave the credential available for a later attempt.
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_data');
        }
      } finally {
        if (active && generation.current === version) setLoading(false);
      }
    };
    void checkAuth();
    return () => { active = false; };
  }, []);

  const login = useCallback((token: string, userData?: User) => {
    generation.current++;
    localStorage.setItem('access_token', token);
    if (userData) localStorage.setItem('user_data', JSON.stringify(userData));
    else localStorage.removeItem('user_data');
    setIsAuthenticated(true);
    setUser(userData || null);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    generation.current++;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
    router.push('/login');
  }, [router]);

  const getUserDisplayName = () => formatUserDisplayName(user);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        loading,
        getUserDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
