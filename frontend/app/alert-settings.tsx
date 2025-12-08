import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { showAlert } from '../utils/showAlert';
import { useAuth } from '../contexts/AuthContext';

export default function AlertSettingsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Email alerts settings
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');

  // WhatsApp alerts settings
  const [whatsappAlertsEnabled, setWhatsappAlertsEnabled] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin_ops/alert-settings');
      
      if (response.data) {
        setEmailAlertsEnabled(response.data.email_alerts_enabled || false);
        setEmailAddress(response.data.email || '');
        setWhatsappAlertsEnabled(response.data.whatsapp_alerts_enabled || false);
        setWhatsappNumber(response.data.whatsapp_number || '');
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      showAlert('Error', 'No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    // Validaciones
    if (emailAlertsEnabled && (!emailAddress || !emailAddress.includes('@'))) {
      showAlert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (whatsappAlertsEnabled && !whatsappNumber) {
      showAlert('Error', 'Por favor ingresa un número de WhatsApp');
      return;
    }

    try {
      setSaving(true);

      await api.post('/api/admin_ops/alert-settings', {
        email_alerts_enabled: emailAlertsEnabled,
        email: emailAddress.trim().toLowerCase(),
        whatsapp_alerts_enabled: whatsappAlertsEnabled,
        whatsapp_number: whatsappNumber.trim(),
      });

      showAlert('Éxito', 'Configuración de alertas guardada correctamente');
      
      // Opcional: volver atrás después de guardar
      setTimeout(() => {
        router.back();
      }, 1500);

    } catch (error: any) {
      console.error('Error saving settings:', error);
      showAlert(
        'Error',
        error.response?.data?.detail || 'No se pudo guardar la configuración'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración de Alertas</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00D2FF" />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#212121" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de Alertas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#00D2FF" />
          <Text style={styles.infoText}>
            Configura cómo quieres recibir alertas de stock bajo y resúmenes diarios de tu negocio.
          </Text>
        </View>

        {/* Email Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="mail" size={20} color="#00D2FF" />
            </View>
            <Text style={styles.sectionTitle}>Alertas por Email</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Activar Email</Text>
                <Text style={styles.settingDescription}>
                  Recibe resúmenes diarios y alertas de stock bajo
                </Text>
              </View>
              <Switch
                value={emailAlertsEnabled}
                onValueChange={setEmailAlertsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
                thumbColor={emailAlertsEnabled ? '#00D2FF' : '#BDBDBD'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            {emailAlertsEnabled && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email para Alertas</Text>
                <TextInput
                  style={styles.input}
                  value={emailAddress}
                  onChangeText={setEmailAddress}
                  placeholder="correo@ejemplo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.inputHint}>
                  Se enviará un resumen diario a las 8:00 PM
                </Text>
              </View>
            )}
          </View>

          {emailAlertsEnabled && (
            <View style={styles.featuresCard}>
              <Text style={styles.featuresTitle}>📧 Incluye:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Resumen diario de ventas y gastos</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Top 5 productos más vendidos</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Alertas de stock bajo</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.featureText}>Balance del día</Text>
              </View>
            </View>
          )}
        </View>

        {/* WhatsApp Alerts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <Text style={styles.sectionTitle}>Alertas por WhatsApp</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingHeader}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Activar WhatsApp</Text>
                <Text style={styles.settingDescription}>
                  Recibe alertas instantáneas en tu WhatsApp
                </Text>
              </View>
              <Switch
                value={whatsappAlertsEnabled}
                onValueChange={setWhatsappAlertsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                thumbColor={whatsappAlertsEnabled ? '#25D366' : '#BDBDBD'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            {whatsappAlertsEnabled && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Número de WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={whatsappNumber}
                  onChangeText={setWhatsappNumber}
                  placeholder="+593987654321"
                  keyboardType="phone-pad"
                />
                <Text style={styles.inputHint}>
                  Incluye el código de país (ej: +593 para Ecuador)
                </Text>
              </View>
            )}
          </View>

          {whatsappAlertsEnabled && (
            <View style={styles.warningCard}>
              <Ionicons name="information-circle-outline" size={20} color="#FF9800" />
              <Text style={styles.warningText}>
                <Text style={styles.warningBold}>Importante:</Text> La primera vez debes enviar "join cake-husband" al WhatsApp de YAPPA para activar las notificaciones.
              </Text>
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Guardar Configuración</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#757575',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginLeft: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
  },
  settingCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
  inputContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  inputHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 6,
    fontStyle: 'italic',
  },
  featuresCard: {
    backgroundColor: '#F1F8E9',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#33691E',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#424242',
    marginLeft: 8,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginLeft: 12,
  },
  warningBold: {
    fontWeight: '700',
    color: '#E65100',
  },
  saveButton: {
    backgroundColor: '#00D2FF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#B3E5FC',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
