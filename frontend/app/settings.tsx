import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import api from '../utils/api';

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
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
    registerForPushNotifications();
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

  const registerForPushNotifications = async () => {
    // Push notifications are not supported in Expo Go
    // This functionality is disabled for now
    console.log('Push notifications disabled (not supported in Expo Go)');
    return;
  };

  const handleSave = async () => {
    if (whatsappNumber && !whatsappNumber.startsWith('+')) {
      Alert.alert('Error', 'El número de WhatsApp debe incluir el código de país (ej: +593...)');
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

      Alert.alert('✅ Guardado', 'Tu configuración se guardó correctamente');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!whatsappNumber && !alertEmail) {
      Alert.alert(
        'Configuración Incompleta',
        'Por favor configura al menos tu número de WhatsApp o email antes de enviar una prueba.'
      );
      return;
    }

    setTesting(true);
    try {
      const response = await api.post('/api/alerts/test');
      const results = response.data.results;

      let message = 'Pruebas enviadas:\n\n';
      
      if (results.whatsapp) {
        message += results.whatsapp.success 
          ? '✅ WhatsApp: Enviado\n' 
          : '❌ WhatsApp: Error\n';
      }
      
      if (results.email) {
        message += results.email.success 
          ? '✅ Email: Enviado\n' 
          : '❌ Email: Error\n';
      }
      
      if (results.push) {
        message += results.push.success 
          ? '✅ Push: Enviado\n' 
          : '❌ Push: Error\n';
      }

      message += '\nRevisa tu WhatsApp y correo en los próximos segundos.';

      Alert.alert('🎉 Prueba Enviada', message);
    } catch (error: any) {
      console.error('Error testing alerts:', error);
      Alert.alert('Error', 'No se pudo enviar la prueba. Verifica tu configuración.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Configuración de Alertas</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Main Toggle */}
        <View style={styles.section}>
          <View style={styles.mainToggle}>
            <View style={styles.mainToggleLeft}>
              <Ionicons name="notifications" size={32} color={alertsEnabled ? '#4CAF50' : '#999'} />
              <View style={styles.mainToggleText}>
                <Text style={styles.mainToggleTitle}>Alertas Activas</Text>
                <Text style={styles.mainToggleSubtitle}>
                  {alertsEnabled ? 'Recibirás notificaciones' : 'Notificaciones desactivadas'}
                </Text>
              </View>
            </View>
            <Switch
              value={alertsEnabled}
              onValueChange={setAlertsEnabled}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Información de Contacto</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número de WhatsApp</Text>
            <TextInput
              style={styles.input}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              placeholder="+593992913093"
              keyboardType="phone-pad"
              editable={alertsEnabled}
            />
            <Text style={styles.hint}>Incluye el código de país (ej: +593)</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email de Alertas</Text>
            <TextInput
              style={styles.input}
              value={alertEmail}
              onChangeText={setAlertEmail}
              placeholder="tu-email@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={alertsEnabled}
            />
          </View>
        </View>

        {/* Alert Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 Tipos de Alertas</Text>
          
          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="cube" size={24} color="#FF9800" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Alertas de Stock</Text>
                <Text style={styles.toggleItemSubtitle}>Diarias a las 8:00 AM</Text>
              </View>
            </View>
            <Switch
              value={stockAlertsEnabled}
              onValueChange={setStockAlertsEnabled}
              disabled={!alertsEnabled}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="stats-chart" size={24} color="#2196F3" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Resumen Diario</Text>
                <Text style={styles.toggleItemSubtitle}>Diario a las 8:00 PM</Text>
              </View>
            </View>
            <Switch
              value={dailySummaryEnabled}
              onValueChange={setDailySummaryEnabled}
              disabled={!alertsEnabled}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleItem}>
            <View style={styles.toggleItemLeft}>
              <Ionicons name="calendar" size={24} color="#9C27B0" />
              <View style={styles.toggleItemText}>
                <Text style={styles.toggleItemTitle}>Resumen Semanal</Text>
                <Text style={styles.toggleItemSubtitle}>Lunes a las 9:00 AM</Text>
              </View>
            </View>
            <Switch
              value={weeklySummaryEnabled}
              onValueChange={setWeeklySummaryEnabled}
              disabled={!alertsEnabled}
              trackColor={{ false: '#ccc', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Las alertas incluyen: productos con stock bajo, resúmenes de ventas y gastos, 
            y recordatorios de deudas pendientes.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.testButton, testing && styles.buttonDisabled]}
            onPress={handleTest}
            disabled={testing || !alertsEnabled}
          >
            {testing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color="#fff" />
                <Text style={styles.testButtonText}>Enviar Prueba</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar Configuración</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  mainToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mainToggleText: {
    marginLeft: 16,
    flex: 1,
  },
  mainToggleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mainToggleSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleItemText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  toggleItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 12,
  },
  testButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
