import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeName, setStoreName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (!isLogin) {
      if (!storeName) {
        Alert.alert('Error', 'Por favor ingresa el nombre de tu tienda');
        return;
      }
      if (!whatsappNumber) {
        Alert.alert('Error', 'Por favor ingresa tu número de WhatsApp');
        return;
      }
      // Validate WhatsApp number format
      const cleanNumber = whatsappNumber.trim().replace(/\s+/g, '');
      if (cleanNumber.length < 10) {
        Alert.alert('Error', 'El número de WhatsApp debe tener al menos 10 dígitos');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        // Ensure number has + prefix for international format
        let formattedNumber = whatsappNumber.trim().replace(/\s+/g, '');
        if (!formattedNumber.startsWith('+')) {
          formattedNumber = '+' + formattedNumber;
        }
        await signUp(email, password, storeName, formattedNumber);
      }
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header minimalista */}
        <View style={styles.header}>
          <Text style={styles.appName}>YAPPA</Text>
          <Text style={styles.title}>
            {isLogin ? 'Bienvenido' : 'Crear cuenta'}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin 
              ? 'Ingresa a tu cuenta para continuar' 
              : 'Registra tu negocio en minutos'}
          </Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ejemplo@correo.com"
                placeholderTextColor="#BDBDBD"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#BDBDBD"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#9E9E9E" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Registro: Campos adicionales */}
          {!isLogin && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre de tu negocio</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="storefront-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Mi Tienda"
                    placeholderTextColor="#BDBDBD"
                    value={storeName}
                    onChangeText={setStoreName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>WhatsApp</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+593 99 123 4567"
                    placeholderTextColor="#BDBDBD"
                    value={whatsappNumber}
                    onChangeText={setWhatsappNumber}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>
                <Text style={styles.helperText}>
                  Recibirás alertas de stock y reportes por WhatsApp
                </Text>
              </View>
            </>
          )}

          {/* Botón principal */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          {/* Forgot password (solo login) */}
          {isLogin && (
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={() => router.push('/forgot-password')}
            >
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

          {/* Switch Login/Register */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchQuestion}>
              {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            </Text>
            <TouchableOpacity
              onPress={() => setIsLogin(!isLogin)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.switchLink}>
                {isLogin ? 'Regístrate' : 'Inicia sesión'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  // Header minimalista
  header: {
    marginBottom: 48,
  },
  appName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00D2FF',
    letterSpacing: 2,
    marginBottom: 24,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#757575',
    lineHeight: 24,
  },

  // Form
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
  },
  helperText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9E9E9E',
    marginTop: 8,
    lineHeight: 16,
  },

  // Botón principal
  button: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Forgot password
  forgotButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  forgotText: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '500',
  },

  // Switch Login/Register
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 6,
  },
  switchQuestion: {
    color: '#757575',
    fontSize: 14,
    fontWeight: '400',
  },
  switchLink: {
    color: '#00D2FF',
    fontSize: 14,
    fontWeight: '600',
  },
});
