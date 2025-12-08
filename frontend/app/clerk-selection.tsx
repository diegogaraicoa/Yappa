import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/showAlert';

export default function ClerkSelectionScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const params = useLocalSearchParams();
  
  const merchant_id = params.merchant_id as string;
  const store_name = params.store_name as string;
  const clerksStr = params.clerks as string;
  const clerks = JSON.parse(clerksStr || '[]');
  
  const [selectedClerkId, setSelectedClerkId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!selectedClerkId) {
      showAlert('Error', 'Selecciona un empleado');
      return;
    }
    
    if (!pin || pin.length !== 4) {
      showAlert('Error', 'Ingresa tu PIN de 4 dígitos');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await api.post('/api/onboarding/login/step2', null, {
        params: {
          merchant_id: merchant_id,
          clerk_id: selectedClerkId,
          pin: pin
        }
      });
      
      if (response.data.success) {
        // Guardar token con los datos del clerk y la tienda
        await login(response.data.token, {
          id: response.data.user.clerk_id,
          email: selectedClerk?.email || '',
          store_id: response.data.user.merchant_id,
          store_name: response.data.user.store_name,
        });
        
        showAlert(
          'Bienvenido',
          `Hola ${response.data.user.clerk_name}!`,
        );
        
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Error en login clerk:', error);
      showAlert('Error', error.response?.data?.detail || 'PIN incorrecto');
      setPin(''); // Limpiar PIN
    } finally {
      setLoading(false);
    }
  };

  const selectedClerk = clerks.find((c: any) => c.clerk_id === selectedClerkId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.logo}>YAPPA</Text>
          <Text style={styles.storeName}>{store_name}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Selecciona tu perfil</Text>
        <Text style={styles.subtitle}>Elige tu nombre de la lista</Text>

        <View style={styles.clerksList}>
          {clerks.map((clerk: any) => (
            <TouchableOpacity
              key={clerk.clerk_id}
              style={[
                styles.clerkCard,
                selectedClerkId === clerk.clerk_id && styles.clerkCardSelected
              ]}
              onPress={() => setSelectedClerkId(clerk.clerk_id)}
            >
              <View style={[
                styles.clerkAvatar,
                selectedClerkId === clerk.clerk_id && styles.clerkAvatarSelected
              ]}>
                <Ionicons
                  name="person"
                  size={24}
                  color={selectedClerkId === clerk.clerk_id ? '#FFF' : '#00D2FF'}
                />
              </View>
              <View style={styles.clerkInfo}>
                <Text style={styles.clerkName}>{clerk.name}</Text>
                <Text style={styles.clerkEmail}>{clerk.email}</Text>
              </View>
              {selectedClerkId === clerk.clerk_id && (
                <Ionicons name="checkmark-circle" size={24} color="#00D2FF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {selectedClerkId && (
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>Ingresa tu PIN</Text>
            <Text style={styles.pinSubtitle}>PIN de 4 dígitos de {selectedClerk?.name}</Text>
            
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="••••"
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
            />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={loading || pin.length !== 4}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#FFF" />
                  <Text style={styles.loginButtonText}>Ingresar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginBottom: 16,
  },
  headerContent: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '900',
    color: '#00D2FF',
    marginBottom: 4,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#424242',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
  },
  clerksList: {
    marginBottom: 24,
  },
  clerkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  clerkCardSelected: {
    borderColor: '#00D2FF',
    backgroundColor: '#E0F7FA',
  },
  clerkAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clerkAvatarSelected: {
    backgroundColor: '#00D2FF',
  },
  clerkInfo: {
    flex: 1,
  },
  clerkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  clerkEmail: {
    fontSize: 14,
    color: '#757575',
  },
  pinSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },
  pinLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  pinSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  pinInput: {
    borderWidth: 2,
    borderColor: '#00D2FF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 12,
    backgroundColor: '#FAFAFA',
    marginBottom: 16,
  },
  loginButton: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
