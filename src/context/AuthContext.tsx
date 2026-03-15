import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  name: string;
  authMethod: 'email' | 'biometric';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, method: 'email' | 'biometric') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fraud_auth_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, method: 'email' | 'biometric') => {
    // Simulate biometric or email auth
    const newUser: User = {
      email,
      name: email.split('@')[0],
      authMethod: method
    };
    
    if (method === 'biometric') {
      // Simulate WebAuthn delay
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setUser(newUser);
    localStorage.setItem('fraud_auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fraud_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
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
