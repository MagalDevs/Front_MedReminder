'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id?: string | number;
  name?: string;
  email?: string;
  [key: string]: unknown; // For additional properties
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

  console.log('Formatting display name for user:', user);

  // Check different possible name properties
  if (typeof user.nome === 'string' && user.nome.trim()) {
    return user.nome.trim();
  }

  if (typeof user.name === 'string' && user.name.trim()) {
    return user.name.trim();
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

  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');

        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        // Retrieve user data from localStorage
        const storedUserData = localStorage.getItem('user_data');
        if (storedUserData) {
          try {
            const userData = JSON.parse(storedUserData) as User;
            setUser(userData);
          } catch (e) {
            console.error('Failed to parse stored user data', e);
          }
        }

        // Optional: Validate token with backend
        // const response = await fetch('https://medreminder-backend.onrender.com/auth/validate', {
        //   headers: {
        //     Authorization: `Bearer ${token}`
        //   }
        // });

        // if (response.ok) {
        //   const userData = await response.json();
        //   setUser(userData);
        //   setIsAuthenticated(true);
        // } else {
        //   // Token is invalid
        //   localStorage.removeItem('token');
        //   setIsAuthenticated(false);
        //   setUser(null);
        // }

        // For now, just assume token presence means authenticated
        setIsAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);
  const login = (token: string, userData?: User) => {
    console.log('AuthContext login called with:', { token: !!token, userData });

    localStorage.setItem('access_token', token);

    // Store user data in localStorage for persistence across refreshes
    if (userData) {
      localStorage.setItem('user_data', JSON.stringify(userData));
      console.log('Stored user data:', userData);
    }

    setIsAuthenticated(true);
    setUser(userData || null);
    console.log('Login successful, user set to:', userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

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
