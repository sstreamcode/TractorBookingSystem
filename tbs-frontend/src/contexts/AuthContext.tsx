import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiLogin, apiRegister, ApiError } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin' | 'tractor_owner' | 'super_admin';
  profilePictureUrl?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'tractor_owner',
    phone?: string,
    address?: string
  ) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTractorOwner: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // On mount, hydrate from token or stored user
    const checkAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      const loginTime = localStorage.getItem('loginTime');
      
      // Check if session has expired (5 minutes = 300000 ms)
      if (loginTime && Date.now() - parseInt(loginTime) > 5 * 60 * 1000) {
        // Session expired
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('loginTime');
        setLoading(false);
        return;
      }
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // If we have a token, validate it with backend
          if (token) {
            fetch((import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:8082' + '/api/auth/me', {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(async (r) => (r.ok ? r.json() : Promise.reject()))
              .then((me) => {
                let roleFromBackend: 'customer' | 'admin' | 'tractor_owner' | 'super_admin' = 'customer';
                if (me.role === 'SUPER_ADMIN') {
                  roleFromBackend = 'super_admin';
                } else if (me.role === 'TRACTOR_OWNER') {
                  roleFromBackend = 'tractor_owner';
                } else if (me.role === 'ADMIN') {
                  roleFromBackend = 'admin';
                }
                
                const updatedUser: User = {
                  id: parsedUser.id || 'self',
                  email: me.email || parsedUser.email,
                  name: me.name || parsedUser.name || me.email?.split('@')[0] || 'User',
                  role: roleFromBackend,
                  profilePictureUrl: me.profilePictureUrl || parsedUser.profilePictureUrl
                };
                setUser(updatedUser);
                // Update localStorage with fresh data from backend
                localStorage.setItem('user', JSON.stringify(updatedUser));
              })
              .catch(() => {
                // token invalid, clear
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                localStorage.removeItem('loginTime');
                setUser(null);
              })
              .finally(() => setLoading(false));
          } else {
            // No token, but we have stored user - use it and finish loading
            // Use setTimeout to ensure state has updated
            setTimeout(() => setLoading(false), 0);
          }
        } catch (e) {
          console.error('Failed to parse stored user:', e);
          setLoading(false);
        }
      } else {
        // No stored user - not authenticated
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Session timeout warning - show warning at 4 minutes, auto logout at 5 minutes
  useEffect(() => {
    if (!user) return;
    
    const checkSessionTimeout = () => {
      const loginTime = localStorage.getItem('loginTime');
      if (!loginTime) return;
      
      const elapsed = Date.now() - parseInt(loginTime);
      const remaining = 5 * 60 * 1000 - elapsed; // 5 minutes total
      
      if (remaining <= 0) {
        // Session expired - logout
        toast.error('Your session has expired. Please login again.');
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('loginTime');
        navigate('/login');
      } else if (remaining <= 60 * 1000 && remaining > 50000) {
        // Show warning at 1 minute remaining
        toast.warning('Your session will expire in 1 minute');
      }
    };
    
    // Check immediately and then every 30 seconds
    checkSessionTimeout();
    const interval = setInterval(checkSessionTimeout, 30000);
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  const login = async (email: string, password: string) => {
    try {
      const { token } = await apiLogin(email, password);
      localStorage.setItem('token', token);
      localStorage.setItem('loginTime', Date.now().toString());
      
      // Fetch full user data from backend
      const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:8082';
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!meResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const me = await meResponse.json();
      let roleFromToken: 'customer' | 'admin' | 'tractor_owner' | 'super_admin' = 'customer';
      if (me.role === 'SUPER_ADMIN') {
        roleFromToken = 'super_admin';
      } else if (me.role === 'TRACTOR_OWNER') {
        roleFromToken = 'tractor_owner';
      } else if (me.role === 'ADMIN') {
        roleFromToken = 'admin';
      }
      
      const fullUser: User = {
        id: 'self',
        email: me.email || email,
        name: me.name || email.split('@')[0],
        role: roleFromToken,
        profilePictureUrl: me.profilePictureUrl || undefined,
      };
      
      setUser(fullUser);
      localStorage.setItem('user', JSON.stringify(fullUser));
      toast.success('Login successful!');
      
      // Navigate based on role
      if (roleFromToken === 'super_admin') {
        navigate('/super-admin/dashboard');
      } else if (roleFromToken === 'tractor_owner') {
        navigate('/tractor-owner/dashboard');
      } else if (roleFromToken === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/tractors');
      }
    } catch (error: any) {
      // Handle pending approval error
      if (error instanceof ApiError && error.status === 403 && (error as any).pendingApproval) {
        toast.error(error.message || 'Your account is pending approval. Please check your email for updates.');
        return;
      }
      if (error instanceof ApiError && error.status === 401) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error?.message || 'Login failed. Please try again.');
      }
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'customer' | 'tractor_owner',
    phone?: string,
    address?: string
  ) => {
    try {
      const result = await apiRegister(email, password, name, role, phone, address);
      
      // Check if registration returned pending approval (for tractor owners)
      if ('pendingApproval' in result && result.pendingApproval) {
        toast.success(result.message || 'Registration successful! Your tractor owner account is pending approval. Please check your email for updates.');
        navigate('/login');
        return;
      }
      
      // Normal registration flow for customers
      const { token } = result as AuthResponse;
      localStorage.setItem('token', token);
      localStorage.setItem('loginTime', Date.now().toString());
      
      // Fetch full user data from backend
      const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:8082';
      const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!meResponse.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const me = await meResponse.json();
      let roleFromBackend: 'customer' | 'admin' | 'tractor_owner' | 'super_admin' = 'customer';
      if (me.role === 'SUPER_ADMIN') {
        roleFromBackend = 'super_admin';
      } else if (me.role === 'TRACTOR_OWNER') {
        roleFromBackend = 'tractor_owner';
      } else if (me.role === 'ADMIN') {
        roleFromBackend = 'admin';
      }
      const fullUser: User = {
        id: 'self',
        email: me.email || email,
        name: me.name || name,
        role: roleFromBackend,
        profilePictureUrl: me.profilePictureUrl || undefined,
      };
      
      setUser(fullUser);
      localStorage.setItem('user', JSON.stringify(fullUser));

      toast.success('Registration successful!');
      navigate('/tractors');
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 409) {
        toast.error('Email already registered');
      } else {
        toast.error(error?.message || 'Registration failed. Please try again.');
      }
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
    toast.success('Logged out successfully');
    navigate('/');
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const BASE_URL = (import.meta as any).env.VITE_API_BASE_URL ?? 'http://localhost:8082';
        const meResponse = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (meResponse.ok) {
          const me = await meResponse.json();
          let roleFromBackend: 'customer' | 'admin' | 'tractor_owner' | 'super_admin' = 'customer';
          if (me.role === 'SUPER_ADMIN') {
            roleFromBackend = 'super_admin';
          } else if (me.role === 'TRACTOR_OWNER') {
            roleFromBackend = 'tractor_owner';
          } else if (me.role === 'ADMIN') {
            roleFromBackend = 'admin';
          }
          
          const updatedUser: User = {
            id: 'self',
            email: me.email || '',
            name: me.name || me.email?.split('@')[0] || 'User',
            role: roleFromBackend,
            profilePictureUrl: me.profilePictureUrl || undefined,
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } catch (e) {
        console.error('Failed to refresh user:', e);
      }
    } else {
      // Fallback to stored user if no token
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error('Failed to parse stored user:', e);
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isTractorOwner: user?.role === 'tractor_owner',
        isSuperAdmin: user?.role === 'super_admin',
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
