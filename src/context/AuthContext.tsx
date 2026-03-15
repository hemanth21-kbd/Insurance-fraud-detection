import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  authMethod: 'email' | 'biometric';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, method: 'email' | 'biometric') => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Authorized simulation list
const AUTHORIZED_EMAILS = [
  'admin@gmail.com',
  'hemanth@gmail.com',
  'tester@gmail.com',
  'agent@insurance.com'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fraud_auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, method: 'email' | 'biometric'): Promise<{ success: boolean; message?: string }> => {
    setError(null);
    
    // Strict validation requirement
    const isAuthorized = AUTHORIZED_EMAILS.includes(email.toLowerCase()) || 
                        email.toLowerCase().endsWith('@gmail.com');

    if (!isAuthorized && method === 'email') {
      const msg = "Access Denied: Unrecognized agent credentials. Please use an authorized @gmail.com account.";
      setError(msg);
      return { success: false, message: msg };
    }

    const newUser: User = {
      email,
      name: email.split('@')[0],
      authMethod: method
    };
    
    if (method === 'biometric') {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setUser(newUser);
    localStorage.setItem('fraud_auth_user', JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('fraud_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
