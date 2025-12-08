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

export default function AuthNewScreen() {
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
  
  // Step 2: Number of stores
  const [numStores, setNumStores] = useState<number | null>(null);
  
  // Step 3: Store names
  const [storeNames, setStoreNames] = useState<string[]>([]);
  
  // Step 4: Clerks per store
  const [clerksData, setClerksData] = useState<{[key: number]: Array<{firstName: string, lastName: string, email: string, pin: string}>}>({});
  
  // State for login
  const [isLogin, setIsLogin] = useState(false);
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
    
    setCurrentStep(2);
  };

  // ============================================
  // STEP 2: Number of Stores
  // ============================================
  
  const handleStep2Next = (numStoresSelected: number) => {
    setNumStores(numStoresSelected);
    
    // Inicializar array de nombres de tiendas
    const initialStoreNames = Array(numStoresSelected).fill('');
    setStoreNames(initialStoreNames);
    
    // Inicializar clerks (al menos 1 por tienda)
    const initialClerks: {[key: number]: Array<{firstName: string, lastName: string, email: string, pin: string}>} = {};
    for (let i = 0; i < numStoresSelected; i++) {
      initialClerks[i] = [{ firstName: '', lastName: '', email: '', pin: '' }];
    }
    setClerksData(initialClerks);
    
    setCurrentStep(3);
  };

  // ============================================
  // STEP 3: Store Names
  // ============================================
  
  const handleStoreNameChange = (index: number, value: string) => {
    const newStoreNames = [...storeNames];
    newStoreNames[index] = value;
    setStoreNames(newStoreNames);
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
    newClerksData[storeIndex].push({ firstName: '', lastName: '', email: '', pin: '' });
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
    setLoading(true);
    
    try {
      // Validar que todos los clerks estén completos
      for (let storeIndex = 0; storeIndex < (numStores || 0); storeIndex++) {
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
          if (!clerk.pin || clerk.pin.length !== 4 || !/^\d{4}$/.test(clerk.pin)) {
            showAlert('Error', `El PIN debe ser de 4 dígitos numéricos para ${clerk.firstName}`);
            setLoading(false);
            return;
          }
        }
      }
      
      // Preparar el request
      const merchants = storeNames.map(name => ({ store_name: name }));
      
      const clerksPerMerchant: {[key: string]: any[]} = {};
      Object.keys(clerksData).forEach(storeIndex => {
        clerksPerMerchant[storeIndex] = clerksData[Number(storeIndex)].map(clerk => ({
          first_name: clerk.firstName,
          last_name: clerk.lastName,
          email: clerk.email,
          pin: clerk.pin
        }));
      });
      
      const response = await api.post('/api/onboarding/complete', {
        admin: {
          company_name: companyName,
          email: email,
          password: password,
          num_stores: numStores
        },
        merchants: merchants,
        clerks_per_merchant: clerksPerMerchant
      });
      
      if (response.data.success) {
        // Guardar token y redirigir a selección de clerk
        await login(response.data.token);
        
        showAlert(
          '¡Registro Exitoso!',
          `Bienvenido a YAPPA, ${companyName}`,
        );
        
        // Redirigir a la app
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      console.error('Error en onboarding:', error);
      showAlert('Error', error.response?.data?.detail || 'No se pudo completar el registro');
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
      // Step 1: Obtener lista de clerks
      const response = await api.post('/api/onboarding/login/step1', null, {
        params: {
          username: loginUsername,
          password: loginPassword
        }
      });
      
      if (response.data.success) {
        // Navegar a pantalla de selección de clerk
        router.push({
          pathname: '/clerk-selection',
          params: {
            merchant_id: response.data.merchant_id,
            store_name: response.data.store_name,
            clerks: JSON.stringify(response.data.clerks)
          }
        });
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
          <Text style={styles.subtitle}>Crea tu cuenta en 4 pasos</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4].map(step => (
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

          {/* STEP 2 */}
          {currentStep === 2 && (
            <>
              <Text style={styles.stepTitle}>Paso 2: ¿Cuántas tiendas tienes?</Text>
              
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleStep2Next(1)}
              >
                <Ionicons name="storefront-outline" size={24} color="#00D2FF" />
                <Text style={styles.optionText}>1 tienda</Text>
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleStep2Next(2)}
              >
                <Ionicons name="business-outline" size={24} color="#00D2FF" />
                <Text style={styles.optionText}>2-5 tiendas</Text>
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleStep2Next(6)}
              >
                <Ionicons name="business" size={24} color="#00D2FF" />
                <Text style={styles.optionText}>Más de 5 tiendas</Text>
                <Ionicons name="chevron-forward" size={20} color="#BDBDBD" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentStep(1)}>
                <Text style={styles.secondaryButtonText}>Atrás</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 3 */}
          {currentStep === 3 && numStores && (
            <>
              <Text style={styles.stepTitle}>Paso 3: Nombres de tus Tiendas</Text>
              
              {storeNames.map((name, index) => (
                <View key={index} style={styles.inputGroup}>
                  <Text style={styles.label}>Tienda {index + 1}</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={(value) => handleStoreNameChange(index, value)}
                    placeholder={`Ej: Tienda ${index === 0 ? 'Centro' : index === 1 ? 'Norte' : index + 1}`}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.primaryButton} onPress={handleStep3Next}>
                <Text style={styles.primaryButtonText}>Siguiente</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={() => setCurrentStep(2)}>
                <Text style={styles.secondaryButtonText}>Atrás</Text>
              </TouchableOpacity>
            </>
          )}

          {/* STEP 4 */}
          {currentStep === 4 && numStores && (
            <>
              <Text style={styles.stepTitle}>Paso 4: Empleados por Tienda</Text>
              <Text style={styles.stepSubtitle}>Crea al menos 1 empleado por tienda</Text>
              
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
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginLeft: 16,
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
