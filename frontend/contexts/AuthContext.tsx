import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

interface User {
  id: string;
  email: string;
  store_id: string;
  store_name: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, storeName: string, whatsappNumber: string) => Promise<void>;
  signOut: () => Promise<void>;
  login: (token: string, userData?: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  async function loadStoredUser() {
    try {
      console.log('🔄 AUTH: Checking for stored session...');
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      console.log('🔍 AUTH: Token exists:', !!storedToken);
      console.log('🔍 AUTH: User exists:', !!storedUser);

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ AUTH: Restoring session for:', parsedUser.store_name || parsedUser.email);
        setUser(parsedUser);
      } else {
        console.log('ℹ️ AUTH: No stored session found');
      }
    } catch (error) {
      console.log('❌ AUTH: Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { access_token, user: userData } = response.data;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al iniciar sesión');
    }
  }

  async function signUp(email: string, password: string, storeName: string, whatsappNumber: string) {
    try {
      const response = await api.post('/api/auth/register', {
        email,
        password,
        store_name: storeName,
        whatsapp_number: whatsappNumber,
      });
      const { access_token, user: userData } = response.data;

      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Error al registrarse');
    }
  }

  async function signOut() {
    console.log('🔴 SIGNOUT: Clearing storage and user...');
    try {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      setUser(null);
      console.log('✅ SIGNOUT: Complete');
    } catch (error) {
      console.error('❌ SIGNOUT ERROR:', error);
    }
  }

  async function login(token: string, userData?: Partial<User>) {
    console.log('🟢 LOGIN: Saving token and user data...');
    try {
      await AsyncStorage.setItem('token', token);
      
      // Si se proporcionaron datos del usuario, usarlos; de lo contrario, crear básicos
      const userToSave: User = userData
        ? {
            id: userData.id || userData.store_id || userData.merchant_id || 'temp',
            email: userData.email || 'temp@yappa.com',
            store_id: userData.store_id || userData.merchant_id || 'temp',
            store_name: userData.store_name || 'Store',
          }
        : {
            id: 'temp',
            email: 'temp@yappa.com',
            store_id: 'temp',
            store_name: 'Store',
          };
      
      await AsyncStorage.setItem('user', JSON.stringify(userToSave));
      setUser(userToSave);
      console.log('✅ LOGIN: Complete. User:', userToSave.store_name);
    } catch (error) {
      console.error('❌ LOGIN ERROR:', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, login }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
