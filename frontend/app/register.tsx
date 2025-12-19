import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

type Step = 'initial' | 'search' | 'join' | 'how_many' | 'single' | 'multi';

interface Store {
  merchant_id: string;
  store_name: string;
  business_name?: string;
  address?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('initial');
  const [loading, setLoading] = useState(false);
  
  // Search & Join flow
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  
  // Single store flow
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState<'owner' | 'employee'>('owner');
  
  // Multi store flow
  const [businessName, setBusinessName] = useState('');
  const [storeNames, setStoreNames] = useState<string[]>(['', '']);

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      alert('Escribe al menos 2 caracteres para buscar');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/api/onboarding/search-stores?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data.stores || []);
      if (response.data.stores?.length === 0) {
        alert('No se encontraron tiendas con ese nombre. Intenta con otro término o registra una nueva.');
      }
    } catch (error) {
      console.error('Error searching stores:', error);
      alert('Error al buscar tiendas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    setStep('join');
  };

  const handleJoinStore = async () => {
    if (!selectedStore) return;
    
    if (!firstName.trim() || !lastName.trim()) {
      alert('Por favor ingresa tu nombre completo');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }
    if (!phone.trim()) {
      alert('Por favor ingresa tu número de WhatsApp');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert('El PIN debe ser de 4 dígitos numéricos');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/api/onboarding/join-store', {
        merchant_id: selectedStore.merchant_id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        pin: pin,
        role: role,
      });
      
      if (response.data.success) {
        await AsyncStorage.setItem('@auth_token', response.data.token);
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data.user));
        alert('¡Bienvenido! Te has unido a la tienda exitosamente');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error al unirse a la tienda';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSingleStore = async () => {
    if (!storeName.trim()) {
      alert('Por favor ingresa el nombre de tu tienda');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert('Por favor ingresa un email válido');
      return;
    }
    if (!password.trim() || password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      alert('Por favor ingresa tu nombre completo');
      return;
    }
    if (!phone.trim()) {
      alert('Por favor ingresa tu número de WhatsApp');
      return;
    }
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      alert('El PIN debe ser de 4 dígitos numéricos');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/api/onboarding/register-single-store', {
        store_name: storeName,
        email: email,
        password: password,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        pin: pin,
        role: role,
      });
      
      if (response.data.success) {
        await AsyncStorage.setItem('@auth_token', response.data.token);
        await AsyncStorage.setItem('@user_data', JSON.stringify(response.data.user));
        alert('¡Registro exitoso! Bienvenido a Yappa');
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Error en el registro';
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStore(null);
    setStoreName('');
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setPin('');
    setRole('owner');
    setBusinessName('');
    setStoreNames(['', '']);
  };

  // ============================================
  // PANTALLA INICIAL: ¿Alguien ya usa Yappa?
  // ============================================
  if (step === 'initial') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>YAPPA</Text>
            <Text style={styles.subtitle}>Registra tu negocio</Text>
          </View>

          <View style={styles.questionCard}>
            <Ionicons name="people" size={48} color="#00D2FF" style={styles.questionIcon} />
            <Text style={styles.questionTitle}>¿Alguien en tu negocio ya usa Yappa?</Text>
            <Text style={styles.questionSubtitle}>
              Si alguien de tu tienda ya se registró, puedes unirte fácilmente
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.choiceButton, styles.yesButton]} 
              onPress={() => setStep('search')}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.choiceButtonText}>Sí, quiero unirme</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.choiceButton, styles.noButton]} 
              onPress={() => setStep('single')}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.choiceButtonText}>No, soy nuevo</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>← Volver al inicio</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ============================================
  // BUSCAR TIENDA EXISTENTE
  // ============================================
  if (step === 'search') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => { resetForm(); setStep('initial'); }}>
              <Ionicons name="arrow-back" size={24} color="#333" />
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.stepTitle}>Busca tu tienda</Text>
              <Text style={styles.stepSubtitle}>Escribe el nombre de la tienda donde trabajas</Text>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Ej: Frutería Pepito"
                placeholderTextColor="#999"
                autoCapitalize="words"
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.searchButtonText}>Buscar</Text>
                )}
              </TouchableOpacity>
            </View>

            {searchResults.length > 0 && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>Resultados ({searchResults.length})</Text>
                {searchResults.map((store, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.storeCard}
                    onPress={() => handleSelectStore(store)}
                  >
                    <Ionicons name="storefront" size={32} color="#00D2FF" />
                    <View style={styles.storeInfo}>
                      <Text style={styles.storeName}>{store.store_name}</Text>
                      {store.business_name && (
                        <Text style={styles.businessName}>{store.business_name}</Text>
                      )}
                      {store.address && (
                        <Text style={styles.storeAddress}>{store.address}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={styles.createNewLink} 
              onPress={() => { resetForm(); setStep('single'); }}
            >
              <Text style={styles.createNewLinkText}>
                ¿No encuentras tu tienda? Crea una nueva →
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============================================
  // UNIRSE A TIENDA EXISTENTE
  // ============================================
  if (step === 'join' && selectedStore) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => setStep('search')}>
              <Ionicons name="arrow-back" size={24} color="#333" />
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.stepTitle}>Únete a {selectedStore.store_name}</Text>
              <Text style={styles.stepSubtitle}>Completa tus datos para unirte</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tu nombre</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nombre"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tu apellido</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Apellido"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+593999123456"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PIN de acceso (4 dígitos)</Text>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>¿Cuál es tu rol?</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleOption, role === 'owner' && styles.roleOptionActive]}
                    onPress={() => setRole('owner')}
                  >
                    <Ionicons 
                      name="person" 
                      size={20} 
                      color={role === 'owner' ? '#FFF' : '#666'} 
                    />
                    <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>
                      Soy dueño/a
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleOption, role === 'employee' && styles.roleOptionActive]}
                    onPress={() => setRole('employee')}
                  >
                    <Ionicons 
                      name="people" 
                      size={20} 
                      color={role === 'employee' ? '#FFF' : '#666'} 
                    />
                    <Text style={[styles.roleText, role === 'employee' && styles.roleTextActive]}>
                      Soy empleado/a
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleJoinStore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Unirme a la tienda</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============================================
  // REGISTRO DE 1 TIENDA
  // ============================================
  if (step === 'single') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => { resetForm(); setStep('initial'); }}>
              <Ionicons name="arrow-back" size={24} color="#333" />
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.stepTitle}>Registra tu tienda</Text>
              <Text style={styles.stepSubtitle}>Crea tu cuenta en Yappa</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>¿Cómo se llama tu tienda?</Text>
                <TextInput
                  style={styles.input}
                  value={storeName}
                  onChangeText={setStoreName}
                  placeholder="Ej: Frutería Pepito"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tu email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Tus datos personales</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tu nombre</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nombre"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tu apellido</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Apellido"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+593999123456"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PIN de acceso (4 dígitos)</Text>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>¿Cuál es tu rol?</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleOption, role === 'owner' && styles.roleOptionActive]}
                    onPress={() => setRole('owner')}
                  >
                    <Ionicons 
                      name="person" 
                      size={20} 
                      color={role === 'owner' ? '#FFF' : '#666'} 
                    />
                    <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>
                      Soy dueño/a
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleOption, role === 'employee' && styles.roleOptionActive]}
                    onPress={() => setRole('employee')}
                  >
                    <Ionicons 
                      name="people" 
                      size={20} 
                      color={role === 'employee' ? '#FFF' : '#666'} 
                    />
                    <Text style={[styles.roleText, role === 'employee' && styles.roleTextActive]}>
                      Soy empleado/a
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleRegisterSingleStore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Crear mi cuenta</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.multiStoreLink} 
                onPress={() => { setStep('multi'); }}
              >
                <Text style={styles.multiStoreLinkText}>
                  ¿Tienes más de una tienda? Regístrate aquí →
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ============================================
  // REGISTRO DE MÚLTIPLES TIENDAS
  // ============================================
  if (step === 'multi') {
    const addStore = () => {
      setStoreNames([...storeNames, '']);
    };
    
    const removeStore = (index: number) => {
      if (storeNames.length > 2) {
        setStoreNames(storeNames.filter((_, i) => i !== index));
      }
    };
    
    const updateStoreName = (index: number, name: string) => {
      const newNames = [...storeNames];
      newNames[index] = name;
      setStoreNames(newNames);
    };
    
    const handleRegisterMultiStore = async () => {
      // Validaciones
      if (!businessName.trim()) {
        alert('Por favor ingresa el nombre de tu negocio');
        return;
      }
      
      const validStores = storeNames.filter(name => name.trim());
      if (validStores.length < 2) {
        alert('Debes agregar al menos 2 tiendas');
        return;
      }
      
      if (!email.trim() || !email.includes('@')) {
        alert('Por favor ingresa un email válido');
        return;
      }
      if (!password.trim() || password.length < 6) {
        alert('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (!firstName.trim() || !lastName.trim()) {
        alert('Por favor ingresa tu nombre completo');
        return;
      }
      if (!phone.trim()) {
        alert('Por favor ingresa tu número de WhatsApp');
        return;
      }
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        alert('El PIN debe ser de 4 dígitos numéricos');
        return;
      }
      
      setLoading(true);
      try {
        // Preparar datos de tiendas
        const stores = validStores.map(name => ({
          store_name: name,
          phone: '',
          address: ''
        }));
        
        // Clerk para la primera tienda
        const clerksPerStore: any = {
          "0": [{
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            pin: pin,
            role: role
          }]
        };
        
        const response = await api.post('/api/onboarding/register-multi-store', {
          business_name: businessName,
          email: email,
          password: password,
          stores: stores,
          clerks_per_store: clerksPerStore
        });
        
        if (response.data.success) {
          await AsyncStorage.setItem('@auth_token', response.data.token);
          alert(`¡Registro exitoso! Se crearon ${response.data.merchants.length} tiendas`);
          router.replace('/(tabs)');
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.detail || 'Error en el registro';
        alert(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => { resetForm(); setStep('single'); }}>
              <Ionicons name="arrow-back" size={24} color="#333" />
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.stepTitle}>Múltiples tiendas</Text>
              <Text style={styles.stepSubtitle}>Registra tu negocio con varias sucursales</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de tu negocio</Text>
                <Text style={styles.labelHint}>Este es el nombre general (ej: "Fruterías Don Pepe")</Text>
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Ej: Fruterías Don Pepe"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Tus tiendas</Text>
                <View style={styles.dividerLine} />
              </View>

              {storeNames.map((name, index) => (
                <View key={index} style={styles.storeInputRow}>
                  <View style={styles.storeInputContainer}>
                    <Text style={styles.storeLabel}>Tienda {index + 1}</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={(text) => updateStoreName(index, text)}
                      placeholder={`Ej: Sucursal ${index === 0 ? 'Centro' : 'Norte'}`}
                      placeholderTextColor="#999"
                    />
                  </View>
                  {storeNames.length > 2 && (
                    <TouchableOpacity 
                      style={styles.removeStoreButton} 
                      onPress={() => removeStore(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#F44336" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity style={styles.addStoreButton} onPress={addStore}>
                <Ionicons name="add-circle" size={20} color="#00D2FF" />
                <Text style={styles.addStoreButtonText}>Agregar otra tienda</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Tu cuenta de administrador</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#999"
                  secureTextEntry
                />
              </View>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Tus datos personales</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tu nombre</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Nombre"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tu apellido</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Apellido"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+593999123456"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PIN de acceso (4 dígitos)</Text>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="••••"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>¿Cuál es tu rol?</Text>
                <View style={styles.roleContainer}>
                  <TouchableOpacity
                    style={[styles.roleOption, role === 'owner' && styles.roleOptionActive]}
                    onPress={() => setRole('owner')}
                  >
                    <Ionicons name="person" size={20} color={role === 'owner' ? '#FFF' : '#666'} />
                    <Text style={[styles.roleText, role === 'owner' && styles.roleTextActive]}>Soy dueño/a</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleOption, role === 'employee' && styles.roleOptionActive]}
                    onPress={() => setRole('employee')}
                  >
                    <Ionicons name="people" size={20} color={role === 'employee' ? '#FFF' : '#666'} />
                    <Text style={[styles.roleText, role === 'employee' && styles.roleTextActive]}>Soy empleado/a</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#00D2FF" />
                <Text style={styles.infoBoxText}>
                  Tu perfil se creará en la primera tienda. Podrás agregar empleados a cada tienda después.
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.primaryButton} 
                onPress={handleRegisterMultiStore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Crear mi negocio</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { flexGrow: 1, padding: 20 },
  
  header: { alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#00D2FF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  
  questionCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 24, 
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionIcon: { marginBottom: 16 },
  questionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 8 },
  questionSubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  
  buttonsContainer: { gap: 12, marginBottom: 24 },
  choiceButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 18, 
    borderRadius: 12, 
    gap: 12 
  },
  yesButton: { backgroundColor: '#4CAF50' },
  noButton: { backgroundColor: '#00D2FF' },
  choiceButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  
  backLink: { alignItems: 'center', padding: 16 },
  backLinkText: { fontSize: 16, color: '#666' },
  
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  backButtonText: { fontSize: 16, color: '#333' },
  
  stepTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  stepSubtitle: { fontSize: 14, color: '#666', textAlign: 'center' },
  
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 50, fontSize: 16, color: '#333' },
  searchButton: { backgroundColor: '#00D2FF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  searchButtonText: { color: '#FFF', fontWeight: '600' },
  
  resultsContainer: { marginBottom: 16 },
  resultsTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12 },
  storeCard: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  storeInfo: { flex: 1, marginLeft: 12 },
  storeName: { fontSize: 16, fontWeight: '600', color: '#333' },
  businessName: { fontSize: 13, color: '#00D2FF', marginTop: 2 },
  storeAddress: { fontSize: 13, color: '#999', marginTop: 2 },
  
  createNewLink: { padding: 16, alignItems: 'center' },
  createNewLinkText: { fontSize: 14, color: '#00D2FF', fontWeight: '500' },
  
  form: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { 
    backgroundColor: '#F5F5F5', 
    borderWidth: 1, 
    borderColor: '#E0E0E0', 
    borderRadius: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontSize: 16, 
    color: '#333' 
  },
  
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dividerText: { paddingHorizontal: 12, fontSize: 12, color: '#999' },
  
  roleContainer: { flexDirection: 'row', gap: 12 },
  roleOption: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 14, 
    borderRadius: 8, 
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  roleOptionActive: { backgroundColor: '#00D2FF', borderColor: '#00D2FF' },
  roleText: { fontSize: 14, color: '#666', fontWeight: '500' },
  roleTextActive: { color: '#FFF' },
  
  primaryButton: { 
    backgroundColor: '#00D2FF', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  
  multiStoreLink: { padding: 16, alignItems: 'center' },
  multiStoreLinkText: { fontSize: 14, color: '#666' },
  
  // Multi-store styles
  labelHint: { fontSize: 12, color: '#999', marginBottom: 8 },
  storeInputRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  storeInputContainer: { flex: 1 },
  storeLabel: { fontSize: 13, fontWeight: '500', color: '#666', marginBottom: 6 },
  removeStoreButton: { padding: 12, backgroundColor: '#FFEBEE', borderRadius: 8 },
  addStoreButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: 12, 
    borderRadius: 8, 
    borderWidth: 1, 
    borderColor: '#00D2FF', 
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 16,
  },
  addStoreButtonText: { fontSize: 14, color: '#00D2FF', fontWeight: '500' },
  infoBox: { 
    flexDirection: 'row', 
    backgroundColor: '#E3F2FD', 
    padding: 12, 
    borderRadius: 8, 
    gap: 10,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  infoBoxText: { flex: 1, fontSize: 13, color: '#1976D2', lineHeight: 18 },
  
  comingSoonCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 16, 
    padding: 32, 
    alignItems: 'center',
    gap: 16,
  },
  comingSoonTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF9800' },
  comingSoonText: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 22 },
});
