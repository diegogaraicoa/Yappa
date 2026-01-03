import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

export default function AdminLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Verify token is still valid
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await api.get('/api/admin/my-merchants');
        if (response.status === 200) {
          // Token is valid, redirect to admin
          if (Platform.OS === 'web') {
            window.location.href = '/admin';
          } else {
            router.replace('/admin');
          }
          return;
        }
      }
    } catch (error) {
      // Token invalid or expired, stay on login page
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    setCheckingAuth(false);
  };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError('Por favor ingresa usuario y contraseña');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Step 1: Login with username/password
      const step1Response = await api.post(
        `/api/onboarding/login/step1?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
      );

      if (!step1Response.data.success) {
        setError('Usuario o contraseña incorrectos');
        setLoading(false);
        return;
      }

      const { merchant_id, store_name, clerks } = step1Response.data;
      
      if (!merchant_id) {
        setError('No se encontró tienda asociada');
        setLoading(false);
        return;
      }

      // Find owner clerk (first clerk is usually owner)
      const ownerClerk = clerks?.find((c: any) => c.name?.toLowerCase().includes('dueño') || c.name?.toLowerCase().includes('owner')) || clerks?.[0];

      if (!ownerClerk) {
        setError('No se encontró acceso de propietario');
        setLoading(false);
        return;
      }

      // Step 2: Complete login with owner PIN (1234 is default)
      console.log('Attempting step2 with:', { merchant_id, clerk_id: ownerClerk.clerk_id });
      
      const step2Response = await api.post(
        `/api/onboarding/login/step2?merchant_id=${merchant_id}&clerk_id=${ownerClerk.clerk_id}&pin=1234`
      );

      console.log('Step2 response:', step2Response.data);
      
      const token = step2Response.data.token || step2Response.data.access_token;
      
      if (token) {
        console.log('Token received, saving...');
        // Save token and user info
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify({
          ...step2Response.data.user,
          store_id: merchant_id,
          store_name: store_name
        }));

        // Set API header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        console.log('Redirecting to admin...');
        // Redirect to admin console
        if (Platform.OS === 'web') {
          window.location.href = '/admin';
        } else {
          router.replace('/admin');
        }
      } else {
        console.log('No token in response:', step2Response.data);
        setError('Error al iniciar sesión - No se recibió token');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00D2FF" />
        <Text style={styles.checkingText}>Verificando sesión...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.loginBox}>
        <Text style={styles.logo}>YAPPA</Text>
        <Text style={styles.subtitle}>Admin Console</Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Usuario</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Nombre de usuario"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Ingresar al Admin Console</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backLink}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/';
            } else {
              router.replace('/');
            }
          }}
        >
          <Text style={styles.backLinkText}>← Volver al App</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  checkingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  loginBox: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00D2FF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  loginButton: {
    backgroundColor: '#00D2FF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  backLinkText: {
    color: '#00D2FF',
    fontSize: 14,
  },
});
