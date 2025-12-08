import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { showAlert } from '../utils/showAlert';

export default function AuthScreen() {
  const router = useRouter();
  const { login } = useAuth();
  
  // Estado del flujo
  const [currentStep, setCurrentStep] = useState(1); // 1-4
  const [loading, setLoading] = useState(false);
  
  // Step 1: Admin data
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Step 2: Ya no se usa, vamos directo a step 3
  
  // Step 3: Store names (dinámico con botón +)
  const [storeNames, setStoreNames] = useState<string[]>(['']);
  
  // Step 4: Clerks per store
  const [clerksData, setClerksData] = useState<{[key: number]: Array<{firstName: string, lastName: string, email: string, phone: string, pin: string}>}>({
    0: [{ firstName: '', lastName: '', email: '', phone: '', pin: '' }]
  });
  
  // State for login (TRUE = mostrar login por defecto)
  const [isLogin, setIsLogin] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // ============================================
  // STEP 1: Admin Data
  // ============================================
  
  const handleStep1Next = () => {
    if (!companyName.trim()) {
      showAlert('Error', 'Ingresa el nombre de tu compañía');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showAlert('Error', 'Ingresa un email válido');
      return;
    }
    if (!password || password.length < 6) {
      showAlert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Las contraseñas no coinciden');
      return;
    }
    
    setCurrentStep(3); // Saltar directo a paso 3
  };

  // ============================================
  // STEP 3: Store Names (Dinámico)
  // ============================================
  
  const handleStoreNameChange = (index: number, value: string) => {
    const newStoreNames = [...storeNames];
    newStoreNames[index] = value;
    setStoreNames(newStoreNames);
  };
  
  const addStore = () => {
    const newStoreNames = [...storeNames, ''];
    setStoreNames(newStoreNames);
    
    // Agregar clerks para la nueva tienda
    const newClerksData = { ...clerksData };
    newClerksData[newStoreNames.length - 1] = [{ firstName: '', lastName: '', email: '', phone: '', pin: '' }];
    setClerksData(newClerksData);
  };
  
  const removeStore = (index: number) => {
    if (storeNames.length <= 1) {
      showAlert('Error', 'Debes tener al menos 1 tienda');
      return;
    }
    
    const newStoreNames = storeNames.filter((_, i) => i !== index);
    setStoreNames(newStoreNames);
    
    // Reorganizar clerks
    const newClerksData: any = {};
    newStoreNames.forEach((name, newIndex) => {
      const oldIndex = storeNames.indexOf(name);
      newClerksData[newIndex] = clerksData[oldIndex] || [{ firstName: '', lastName: '', email: '', phone: '', pin: '' }];
    });
    setClerksData(newClerksData);
  };
  
  const handleStep3Next = () => {
    // Validar que todos los nombres estén llenos
    const emptyStores = storeNames.filter(name => !name.trim());
    if (emptyStores.length > 0) {
      showAlert('Error', 'Ingresa el nombre de todas tus tiendas');
      return;
    }
    
    setCurrentStep(4);
  };

  // ============================================
  // STEP 4: Clerks
  // ============================================
  
  const handleClerkChange = (storeIndex: number, clerkIndex: number, field: string, value: string) => {
    const newClerksData = { ...clerksData };
    newClerksData[storeIndex][clerkIndex] = {
      ...newClerksData[storeIndex][clerkIndex],
      [field]: value
    };
    setClerksData(newClerksData);
  };
  
  const addClerkToStore = (storeIndex: number) => {
    const newClerksData = { ...clerksData };
    newClerksData[storeIndex].push({ firstName: '', lastName: '', email: '', phone: '', pin: '' });
    setClerksData(newClerksData);
  };
  
  const removeClerkFromStore = (storeIndex: number, clerkIndex: number) => {
    if (clerksData[storeIndex].length <= 1) {
      showAlert('Error', 'Cada tienda debe tener al menos 1 empleado');
      return;
    }
    
    const newClerksData = { ...clerksData };
    newClerksData[storeIndex].splice(clerkIndex, 1);
    setClerksData(newClerksData);
  };
  
  const handleCompleteOnboarding = async () => {
    console.log('=== STARTING ONBOARDING ===');
    setLoading(true);
    
    try {
      // Validar que todos los clerks estén completos
      for (let storeIndex = 0; storeIndex < storeNames.length; storeIndex++) {
        const clerks = clerksData[storeIndex];
        for (let clerkIndex = 0; clerkIndex < clerks.length; clerkIndex++) {
          const clerk = clerks[clerkIndex];
          if (!clerk.firstName.trim() || !clerk.lastName.trim()) {
            showAlert('Error', `Completa los datos del empleado ${clerkIndex + 1} de ${storeNames[storeIndex]}`);
            setLoading(false);
            return;
          }
          if (!clerk.email.trim() || !clerk.email.includes('@')) {
            showAlert('Error', `Email inválido para empleado de ${storeNames[storeIndex]}`);
            setLoading(false);
            return;
          }
          if (!clerk.phone.trim() || clerk.phone.length < 10) {
            showAlert('Error', `Número de teléfono inválido para ${clerk.firstName}`);
            setLoading(false);
            return;
          }
          if (!clerk.pin || clerk.pin.length !== 4 || !/^\d{4}$/.test(clerk.pin)) {
            showAlert('Error', `El PIN debe ser de 4 dígitos numéricos para ${clerk.firstName}`);
            setLoading(false);
            return;
          }
        }
      }
      
      console.log('Validation passed, preparing request...');
      
      // Preparar el request
      const merchants = storeNames.map(name => ({ store_name: name }));
      
      const clerksPerMerchant: {[key: string]: any[]} = {};
      Object.keys(clerksData).forEach(storeIndex => {
        clerksPerMerchant[storeIndex] = clerksData[Number(storeIndex)].map(clerk => ({
          first_name: clerk.firstName,
          last_name: clerk.lastName,
          email: clerk.email,
          phone: clerk.phone,
          pin: clerk.pin
        }));
      });
      
      console.log('Sending request to backend...');
      
      const response = await api.post('/api/onboarding/complete', {
        admin: {
          company_name: companyName,
          email: email,
          password: password,
          num_stores: storeNames.length
        },
        merchants: merchants,
        clerks_per_merchant: clerksPerMerchant
      });
      
      console.log('Response received:', response.data);
      
      if (response.data.success) {
        // Guardar token
        await login(response.data.token);
        
        showAlert(
          'Registro Exitoso',
          `Bienvenido a YAPPA, ${companyName}. Los PINs han sido enviados a los emails de los empleados.`
        );
        
        // Redirigir a la app
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error en onboarding:', error);
      const errorMsg = error.response?.data?.detail || error.message || 'No se pudo completar el registro';
      showAlert('Error al Registrar', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOGIN
  // ============================================
  
  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword) {
      showAlert('Error', 'Ingresa tus credenciales');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Login step 1...');
      console.log('Username:', loginUsername);
      console.log('Password:', loginPassword ? '***' : 'empty');
      
      const url = `/api/onboarding/login/step1?username=${encodeURIComponent(loginUsername)}&password=${encodeURIComponent(loginPassword)}`;
      console.log('Request URL:', url.replace(loginPassword, '***'));
      
      const response = await api.post(url);
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        // Si es cuenta antigua (sin clerks), login directo
        if (response.data.legacy_account) {
          await login(response.data.token, response.data.user);
          showAlert('Bienvenido', response.data.message || 'Login exitoso');
          setTimeout(() => {
            router.replace('/(tabs)');
          }, 500);
        } else {
          // Cuenta nueva - ir a selección de clerk
          router.push({
            pathname: '/clerk-selection',
            params: {
              merchant_id: response.data.merchant_id,
              store_name: response.data.store_name,
              clerks: JSON.stringify(response.data.clerks)
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Error en login:', error);
      showAlert('Error', error.response?.data?.detail || 'Credenciales inválidas');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  
  if (isLogin) {
    return (
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logo}>YAPPA</Text>
            <Text style={styles.subtitle}>Inicia sesión en tu cuenta</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Usuario de tu tienda</Text>
              <TextInput
                style={styles.input}
                value={loginUsername}
                onChangeText={setLoginUsername}
                placeholder="usuario"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="••••••"
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Continuar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => setIsLogin(false)}>
              <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>YAPPA</Text>
          <Text style={styles.subtitle}>Crea tu cuenta en 3 pasos</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 3, 4].map(step => (
            <View
              key={step}
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive
              ]}
            />
          ))}
        </View>

        {/* Step Content */}
        <View style={styles.form}>
          {/* STEP 1 */}
          {currentStep === 1 && (
            <>
              <Text style={styles.stepTitle}>Paso 1: Datos de tu Compañía</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de la Compañía</Text>
                <TextInput
                  style={styles.input}
                  value={companyName}
                  onChangeText={setCompanyName}
                  placeholder="Ej: Importadora CIA LTDA"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repite tu contraseña"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={handleStep1Next}>
                <Text style={styles.primaryButtonText}>Siguiente</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 3 (ahora es paso 2) */}
          {currentStep === 3 && (
            <>
              <Text style={styles.stepTitle}>Paso 2: Nombres de tus Tiendas</Text>
              <Text style={styles.stepSubtitle}>Agrega todas las tiendas que necesites con el botón +</Text>
              
              {storeNames.map((name, index) => (
                <View key={index} style={styles.storeInputRow}>
                  <View style={styles.inputGroup} style={{ flex: 1 }}>
                    <Text style={styles.label}>Tienda {index + 1}</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={(value) => handleStoreNameChange(index, value)}
                      placeholder={`Ej: Tienda ${index === 0 ? 'Centro' : index === 1 ? 'Norte' : index + 1}`}
                    />
                  </View>
                  {storeNames.length > 1 && (
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
                <Ionicons name="add-circle" size={24} color="#00D2FF" />
                <Text style={styles.addStoreText}>Agregar otra tienda</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.primaryButton} onPress={handleStep3Next}>
                <Text style={styles.primaryButtonText}>Siguiente</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentStep(1)}>
                <Text style={styles.secondaryButtonText}>Atrás</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 4 (ahora es paso 3) */}
          {currentStep === 4 && (
            <>
              <Text style={styles.stepTitle}>Paso 3: Empleados por Tienda</Text>
              <Text style={styles.stepSubtitle}>El PIN será enviado por email a cada empleado</Text>
              
              {storeNames.map((storeName, storeIndex) => (
                <View key={storeIndex} style={styles.storeSection}>
                  <View style={styles.storeSectionHeader}>
                    <Ionicons name="storefront" size={20} color="#00D2FF" />
                    <Text style={styles.storeSectionTitle}>{storeName}</Text>
                  </View>

                  {clerksData[storeIndex]?.map((clerk, clerkIndex) => (
                    <View key={clerkIndex} style={styles.clerkCard}>
                      <View style={styles.clerkCardHeader}>
                        <Text style={styles.clerkCardTitle}>Empleado {clerkIndex + 1}</Text>
                        {clerksData[storeIndex].length > 1 && (
                          <TouchableOpacity onPress={() => removeClerkFromStore(storeIndex, clerkIndex)}>
                            <Ionicons name="trash-outline" size={20} color="#F44336" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.clerkRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                          <Text style={styles.labelSmall}>Nombre</Text>
                          <TextInput
                            style={styles.inputSmall}
                            value={clerk.firstName}
                            onChangeText={(value) => handleClerkChange(storeIndex, clerkIndex, 'firstName', value)}
                            placeholder="Juan"
                          />
                        </View>

                        <View style={[styles.inputGroup, { flex: 1 }]}>
                          <Text style={styles.labelSmall}>Apellido</Text>
                          <TextInput
                            style={styles.inputSmall}
                            value={clerk.lastName}
                            onChangeText={(value) => handleClerkChange(storeIndex, clerkIndex, 'lastName', value)}
                            placeholder="Pérez"
                          />
                        </View>
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.labelSmall}>Email</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={clerk.email}
                          onChangeText={(value) => handleClerkChange(storeIndex, clerkIndex, 'email', value)}
                          placeholder="juan@ejemplo.com"
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.labelSmall}>Teléfono / WhatsApp</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={clerk.phone}
                          onChangeText={(value) => handleClerkChange(storeIndex, clerkIndex, 'phone', value)}
                          placeholder="+593999999999"
                          keyboardType="phone-pad"
                        />
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.labelSmall}>PIN (4 dígitos)</Text>
                        <TextInput
                          style={styles.inputSmall}
                          value={clerk.pin}
                          onChangeText={(value) => handleClerkChange(storeIndex, clerkIndex, 'pin', value)}
                          placeholder="1234"
                          keyboardType="number-pad"
                          maxLength={4}
                          secureTextEntry
                        />
                        <Text style={styles.helperText}>Este PIN será enviado al email del empleado</Text>
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addClerkButton}
                    onPress={() => addClerkToStore(storeIndex)}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#00D2FF" />
                    <Text style={styles.addClerkText}>Agregar otro empleado</Text>
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>Completar Registro</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentStep(3)}>
                <Text style={styles.secondaryButtonText}>Atrás</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Login Link */}
          {currentStep === 1 && (
            <TouchableOpacity style={styles.linkButton} onPress={() => setIsLogin(true)}>
              <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#00D2FF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  progressDotActive: {
    backgroundColor: '#00D2FF',
  },
  form: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#FFF',
  },
  inputSmall: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  helperText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 4,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#424242',
    fontSize: 16,
    fontWeight: '600',
  },
  storeInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  removeStoreButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  addStoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#E0F7FA',
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  addStoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00D2FF',
  },
  storeSection: {
    marginBottom: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  storeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  storeSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginLeft: 8,
  },
  clerkCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  clerkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clerkCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
  },
  clerkRow: {
    flexDirection: 'row',
  },
  addClerkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  addClerkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D2FF',
    marginLeft: 8,
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#00D2FF',
    fontWeight: '600',
  },
});