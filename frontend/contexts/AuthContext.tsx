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
  login: (token: string) => Promise<void>;
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
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.log('Error loading user:', error);
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

  async function login(token: string) {
    console.log('🟢 LOGIN: Saving token...');
    try {
      await AsyncStorage.setItem('token', token);
      // Crear un user básico para que el estado cambie
      const basicUser = {
        id: 'temp',
        email: 'temp',
        store_id: 'temp',
        store_name: 'Store'
      };
      await AsyncStorage.setItem('user', JSON.stringify(basicUser));
      setUser(basicUser);
      console.log('✅ LOGIN: Complete');
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
