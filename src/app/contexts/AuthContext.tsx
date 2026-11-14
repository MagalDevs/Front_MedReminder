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
import RequestFeedback from '../components/RequestFeedback/RequestFeedback';
import { requestErrorMessage, RequestContractError } from '../utils/request-errors';
import { clearNavigationFeedback, publishNavigationFeedback } from '../utils/navigation-feedback';

interface User {
  id?: string | number;
  nome?: string;
  email?: string;
  cep?: string;
  cpf?: string;
  cuidador?: boolean;
  dataNasc?: Date | string;
  senha?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, userData?: User) => void;
  logout: () => void;
  loading: boolean;
  getUserDisplayName: () => string;
  sessionStatus: 'restoring' | 'authenticated' | 'anonymous' | 'unavailable';
  restorationError: string | null;
  retryRestoration: () => void;
  revalidateSession: () => Promise<'valid' | 'expired' | 'unavailable' | 'stale'>;
  identityGeneration: number;
  identityKey: string;
  returnTarget: string;
  rememberReturnTarget: (value: string | null | undefined) => string;
  consumeReturnTarget: (value?: string | null) => string;
  updateProfile: (profile: Pick<User, 'id' | 'nome' | 'email' | 'cep' | 'dataNasc'>, expectedIdentity: string) => void;
}

/** Only product destinations can become a post-authentication return target. */
export function safeInternalReturnTarget(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\s\u0000-\u001f\u007f]/.test(value) || /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f)/i.test(value)) return '/hoje';
  try {
    const url = new URL(value, 'https://medreminder.internal');
    const path = value.split(/[?#]/)[0];
    const routes = ['/', '/hoje', '/meus-medicamentos', '/meus-lembretes', '/novo-medicamento', '/historico', '/Configuracoes'];
    if (url.origin !== 'https://medreminder.internal' || url.pathname !== path || !(routes.includes(path) || /^\/meus-medicamentos\/[1-9]\d*\/editar$/.test(path))) return '/hoje';
    return `${path}${url.search}${url.hash}`;
  } catch { return '/hoje'; }
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
  const [restorationError, setRestorationError] = useState<string | null>(null);
  const [restorationAttempt, setRestorationAttempt] = useState(0);
  const [restoreNotBefore, setRestoreNotBefore] = useState(0);
  const [identityGeneration, setIdentityGeneration] = useState(0);
  const [returnTarget, setReturnTarget] = useState('/hoje');
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  // Each explicit login/logout revokes outstanding restoration responses.
  const generation = useRef(0);
  const restoration = useRef<AbortController | null>(null);
  const revalidation = useRef<AbortController | null>(null);

  useEffect(() => {
    const invalidate = () => {
      generation.current++;
      setIdentityGeneration(previous => previous + 1);
      restoration.current?.abort();
      revalidation.current?.abort();
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      setRestorationError(null);
      publishNavigationFeedback('session-expired');
      routerRef.current.push('/login');
    };
    window.addEventListener(SESSION_INVALIDATED_EVENT, invalidate);
    return () => window.removeEventListener(SESSION_INVALIDATED_EVENT, invalidate);
  }, []);

  // Each explicit login/logout revokes outstanding restoration responses.

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    restoration.current = controller;
    const version = generation.current;
    const token = localStorage.getItem('access_token');
    const current = () => active && generation.current === version &&
      localStorage.getItem('access_token') === token;
    const checkAuth = async () => {
      try {
        if (!token) return;
        const response = await apiRequest<{ data: User }>('usuario/me', {
          method: 'GET', onUnauthorized: 'throw', signal: controller.signal,
        });
        if (!current()) return;
        if (!response?.data || !response.data.id) throw new RequestContractError();
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
          generation.current++;
          setIdentityGeneration(previous => previous + 1);
          publishNavigationFeedback('session-expired');
          routerRef.current.push('/login');
        } else {
          setRestorationError(requestErrorMessage(error, 'session'));
          setRestoreNotBefore(error instanceof ApiError && error.status === 429 && error.retryAfter !== undefined ? Date.now() + error.retryAfter * 1000 : 0);
        }
      } finally {
        if (current() || (active && !localStorage.getItem('access_token'))) setLoading(false);
      }
    };
    void checkAuth();
    return () => { active = false; controller.abort(); };
  }, [restorationAttempt]);

  useEffect(() => () => { revalidation.current?.abort(); }, []);

  const retryRestoration = useCallback(() => {
    if (!restorationError || Date.now() < restoreNotBefore) return;
    generation.current++;
    restoration.current?.abort();
    setRestorationError(null);
    setLoading(true);
    setRestorationAttempt(previous => previous + 1);
  }, [restorationError, restoreNotBefore]);

  const login = useCallback((token: string, userData?: User) => {
    generation.current++;
    setIdentityGeneration(previous => previous + 1);
    restoration.current?.abort();
    revalidation.current?.abort();
    setRestorationError(null);
    clearNavigationFeedback();
    localStorage.setItem('access_token', token);
    if (userData) localStorage.setItem('user_data', JSON.stringify(userData));
    else localStorage.removeItem('user_data');
    setIsAuthenticated(Boolean(userData?.id));
    setUser(userData?.id ? userData : null);
    setLoading(!userData?.id);
    if (!userData?.id) setRestorationAttempt(previous => previous + 1);
  }, []);

  const logout = useCallback(() => {
    generation.current++;
    setIdentityGeneration(previous => previous + 1);
    restoration.current?.abort();
    revalidation.current?.abort();
    setReturnTarget('/hoje');
    setRestorationError(null);
    clearNavigationFeedback();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
    routerRef.current.push('/login');
  }, []);

  const revalidateSession = useCallback(async (): Promise<'valid' | 'expired' | 'unavailable' | 'stale'> => {
    const version = generation.current;
    const token = localStorage.getItem('access_token');
    if (!token) return 'expired';
    revalidation.current?.abort();
    const controller = new AbortController();
    revalidation.current = controller;
    const active = () => !controller.signal.aborted && version === generation.current && localStorage.getItem('access_token') === token;
    try {
      const profile = await apiRequest<{ data: User }>('usuario/me', { method: 'GET', onUnauthorized: 'throw', signal: controller.signal });
      if (!active()) return 'stale';
      if (!profile?.data?.id) throw new RequestContractError();
      return 'valid';
    } catch (error) {
      if (!active()) return 'stale';
      if (error instanceof ApiError && error.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        window.dispatchEvent(new Event(SESSION_INVALIDATED_EVENT));
        return 'expired';
      }
      return 'unavailable';
    }
  }, []);

  const rememberReturnTarget = useCallback((value: string | null | undefined) => {
    const target = safeInternalReturnTarget(value);
    setReturnTarget(target);
    return target;
  }, []);
  const consumeReturnTarget = useCallback((value?: string | null) => {
    const target = safeInternalReturnTarget(value ?? returnTarget);
    setReturnTarget('/hoje');
    return target;
  }, [returnTarget]);

  const profileToken = typeof window === 'undefined' ? null : localStorage.getItem('access_token');
  const updateProfile = useCallback((profile: Pick<User, 'id' | 'nome' | 'email' | 'cep' | 'dataNasc'>, expectedIdentity: string) => {
    if (!user?.id || String(profile.id) !== String(user.id) || expectedIdentity !== `${user.id}:${generation.current}` || !profileToken || localStorage.getItem('access_token') !== profileToken) return;
    if (!['nome', 'email', 'cep', 'dataNasc'].every(field => profile[field as keyof typeof profile] === undefined || typeof profile[field as keyof typeof profile] === 'string')) return;
    const metadata = Object.fromEntries(['nome', 'email', 'cep', 'dataNasc'].filter(field => profile[field as keyof typeof profile] !== undefined).map(field => [field, profile[field as keyof typeof profile]]));
    const next = { ...user, ...metadata };
    setUser(next);
    localStorage.setItem('user_data', JSON.stringify(next));
  }, [user, profileToken]);

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
        sessionStatus: loading ? 'restoring' : isAuthenticated ? 'authenticated' : restorationError ? 'unavailable' : 'anonymous',
        restorationError,
        retryRestoration,
        revalidateSession,
        identityGeneration,
        identityKey: isAuthenticated && user ? `${user.id ?? user.email ?? ''}:${identityGeneration}` : '',
        returnTarget,
        rememberReturnTarget,
        consumeReturnTarget,
        updateProfile,
      }}
    >
      {loading && <RequestFeedback kind="loading" message="Verificando sessão…" />}
      {restorationError && <RequestFeedback context="Restaurar sessão" message={restorationError} retry={{ onRetry: retryRestoration, notBefore: restoreNotBefore }} />}
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
