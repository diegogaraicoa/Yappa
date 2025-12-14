import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import api from '../utils/api';
import { showAlert } from '../utils/showAlert';
import { useNotifications } from '../contexts/NotificationContext';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function SettingsScreen() {
  const router = useRouter();
  const { sendTestNotification, requestPermissions, expoPushToken } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Form state
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [expoPushToken, setExpoPushToken] = useState('');

  // Toggle states
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [stockAlertsEnabled, setStockAlertsEnabled] = useState(true);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(true);
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get('/api/user/notification-settings');
      const settings = response.data;

      setWhatsappNumber(settings.whatsapp_number || '');
      setAlertEmail(settings.alert_email || '');
      setExpoPushToken(settings.expo_push_token || '');
      setAlertsEnabled(settings.alerts_enabled ?? true);
      setStockAlertsEnabled(settings.stock_alerts_enabled ?? true);
      setDailySummaryEnabled(settings.daily_summary_enabled ?? true);
      setWeeklySummaryEnabled(settings.weekly_summary_enabled ?? true);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (whatsappNumber && !whatsappNumber.startsWith('+')) {
      showAlert(
        'Error',
        'El número de WhatsApp debe incluir el código de país (ej: +593...)'
      );
      return;
    }

    setSaving(true);
    try {
      await api.post('/api/user/notification-settings', {
        whatsapp_number: whatsappNumber || null,
        alert_email: alertEmail || null,
        expo_push_token: expoPushToken || null,
        alerts_enabled: alertsEnabled,
        stock_alerts_enabled: stockAlertsEnabled,
        daily_summary_enabled: dailySummaryEnabled,
        weekly_summary_enabled: weeklySummaryEnabled,
      });

      showAlert('Éxito', 'Tu configuración se guardó correctamente');
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

  const handleTest = async () => {
    if (!whatsappNumber || whatsappNumber.length < 10) {
      showAlert(
        'Número requerido',
        'Por favor configura tu número de WhatsApp primero'
      );
      return;
    }

    setTesting(true);
    
    setTimeout(async () => {
      try {
        console.log('Sending test alert to:', whatsappNumber);
        const response = await api.post('/api/alerts/test', {
          whatsapp_number: whatsappNumber,
        });
        
        console.log('Test alert response:', response.data);
        
        // Esperar un frame antes de mostrar el Alert
        requestAnimationFrame(() => {
          showAlert(
            'Mensaje Enviado',
            'Se ha enviado un mensaje de prueba a tu WhatsApp',
            [{ text: 'OK' }]
          );
        });
      } catch (error: any) {
        console.error('Error sending test:', error);
        requestAnimationFrame(() => {
          showAlert(
            'Error',
            'No se pudo enviar el mensaje de prueba',
            [{ text: 'OK' }]
          );
        });
      } finally {
        setTesting(false);
      }
    }, 50);
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      // Primero solicitar permisos si no los tenemos
      const granted = await requestPermissions();
      
      if (!granted) {
        showAlert('Permisos Requeridos', 'Debes permitir las notificaciones para recibir alertas.');
        return;
      }
      
      // Enviar notificación de prueba
      await sendTestNotification();
      showAlert('¡Listo!', 'Se envió una notificación de prueba. Debería aparecer en tu dispositivo.');
    } catch (error) {
      console.error('Error testing push:', error);
      showAlert('Error', 'No se pudo enviar la notificación de prueba.');
    } finally {
      setTestingPush(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#607D8B" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
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
        <Text style={styles.headerTitle}>Alertas de tu Negocio</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Toggle Card */}
        <View style={styles.mainCard}>
          <View style={styles.mainCardHeader}>
            <View style={styles.mainIconContainer}>
              <Ionicons
                name="notifications"
                size={28}
                color={alertsEnabled ? '#607D8B' : '#9E9E9E'}
              />
            </View>
            <View style={styles.mainCardText}>
              <Text style={styles.mainCardTitle}>Alertas Activas</Text>
              <Text style={styles.mainCardSubtitle}>
                {alertsEnabled
                  ? 'Recibirás notificaciones'
                  : 'Notificaciones desactivadas'}
              </Text>
            </View>
            <Switch
              value={alertsEnabled}
              onValueChange={setAlertsEnabled}
              trackColor={{ false: '#E0E0E0', true: '#B0BEC5' }}
              thumbColor={alertsEnabled ? '#607D8B' : '#F5F5F5'}
              ios_backgroundColor="#E0E0E0"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INFORMACIÓN DE CONTACTO</Text>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <View style={styles.inputHeader}>
                <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                <Text style={styles.inputLabel}>Número de WhatsApp</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  !alertsEnabled && styles.inputDisabled,
                ]}
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                placeholder="+593 99 123 4567"
                placeholderTextColor="#BDBDBD"
                keyboardType="phone-pad"
                editable={alertsEnabled}
              />
              <Text style={styles.hint}>
                Incluye el código de país (ej: +593)
              </Text>
            </View>
          </View>
        </View>

        {/* Alert Types */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TIPOS DE ALERTAS</Text>

          <View style={styles.card}>
            {/* Stock Alerts */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View
                  style={[
                    styles.toggleIcon,
                    { backgroundColor: '#FFF3E0' },
                  ]}
                >
                  <Ionicons name="cube" size={22} color="#FF9800" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Alertas de Stock</Text>
                  <Text style={styles.toggleSubtitle}>Diarias a las 8:00 AM</Text>
                </View>
              </View>
              <Switch
                value={stockAlertsEnabled}
                onValueChange={setStockAlertsEnabled}
                disabled={!alertsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#B0BEC5' }}
                thumbColor={stockAlertsEnabled ? '#607D8B' : '#F5F5F5'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.divider} />

            {/* Daily Summary */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View
                  style={[
                    styles.toggleIcon,
                    { backgroundColor: '#E3F2FD' },
                  ]}
                >
                  <Ionicons name="stats-chart" size={22} color="#2196F3" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Resumen Diario</Text>
                  <Text style={styles.toggleSubtitle}>Diario a las 8:00 PM</Text>
                </View>
              </View>
              <Switch
                value={dailySummaryEnabled}
                onValueChange={setDailySummaryEnabled}
                disabled={!alertsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#B0BEC5' }}
                thumbColor={dailySummaryEnabled ? '#607D8B' : '#F5F5F5'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>

            <View style={styles.divider} />

            {/* Weekly Summary */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <View
                  style={[
                    styles.toggleIcon,
                    { backgroundColor: '#F3E5F5' },
                  ]}
                >
                  <Ionicons name="calendar" size={22} color="#9C27B0" />
                </View>
                <View style={styles.toggleText}>
                  <Text style={styles.toggleTitle}>Resumen Semanal</Text>
                  <Text style={styles.toggleSubtitle}>Lunes a las 9:00 AM</Text>
                </View>
              </View>
              <Switch
                value={weeklySummaryEnabled}
                onValueChange={setWeeklySummaryEnabled}
                disabled={!alertsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#B0BEC5' }}
                thumbColor={weeklySummaryEnabled ? '#607D8B' : '#F5F5F5'}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoText}>
            Recibirás alertas por WhatsApp sobre: productos con stock bajo,
            resúmenes de ventas y gastos, y recordatorios de deudas pendientes.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.testButton,
              (testing || !alertsEnabled) && styles.buttonDisabled,
            ]}
            onPress={handleTest}
            disabled={testing || !alertsEnabled}
            activeOpacity={0.8}
          >
            {testing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
                <Text style={styles.testButtonText}>Enviar Prueba</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Guardar Configuración</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9E9E9E',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },

  // Main Card
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mainCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  mainIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCardText: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  mainCardSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#757575',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // Input
  inputGroup: {
    gap: 8,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '400',
    color: '#212121',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  inputDisabled: {
    opacity: 0.5,
  },
  hint: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9E9E9E',
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  toggleIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },
  toggleSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#757575',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5F5F5',
    marginVertical: 8,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    color: '#1565C0',
    lineHeight: 20,
  },

  // Buttons
  buttonContainer: {
    gap: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#607D8B',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    shadowColor: '#607D8B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
