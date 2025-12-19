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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../utils/api';
import { useNotifications } from '../contexts/NotificationContext';

export default function AlertSettingsScreen() {
  const router = useRouter();
  const { sendTestNotification, requestPermissions, expoPushToken } = useNotifications();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  // Contact info - Solo WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Individual alert preferences - Solo WhatsApp y Push
  const [stockAlertWhatsapp, setStockAlertWhatsapp] = useState(false);
  const [stockAlertPush, setStockAlertPush] = useState(true);
  const [debtAlertPush, setDebtAlertPush] = useState(true);
  const [dailyWhatsapp, setDailyWhatsapp] = useState(false);
  const [dailyPush, setDailyPush] = useState(false);
  const [weeklyWhatsapp, setWeeklyWhatsapp] = useState(false);
  const [weeklyPush, setWeeklyPush] = useState(true);
  const [monthlyWhatsapp, setMonthlyWhatsapp] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin-ops/alert-settings');
      
      if (response.data) {
        // WhatsApp settings
        setWhatsappNumber(response.data.whatsapp_number || '');
        setStockAlertWhatsapp(response.data.stock_alert_whatsapp || false);
        setDailyWhatsapp(response.data.daily_whatsapp || false);
        setWeeklyWhatsapp(response.data.weekly_whatsapp || false);
        setMonthlyWhatsapp(response.data.monthly_whatsapp || false);
        
        // Push notification settings
        setStockAlertPush(response.data.stock_alert_push !== false);
        setDebtAlertPush(response.data.debt_alert_push !== false);
        setDailyPush(response.data.daily_push || false);
        setWeeklyPush(response.data.weekly_push !== false);
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    // Validaciones
    const hasWhatsappAlerts = stockAlertWhatsapp || dailyWhatsapp || weeklyWhatsapp || monthlyWhatsapp;

    if (hasWhatsappAlerts && !whatsappNumber) {
      Alert.alert('Error', 'Por favor ingresa un número de WhatsApp');
      return;
    }

    try {
      setSaving(true);

      const response = await api.post('/api/admin_ops/alert-settings', {
        whatsapp_number: (whatsappNumber || '').trim(),
        stock_alert_whatsapp: stockAlertWhatsapp,
        stock_alert_push: stockAlertPush,
        debt_alert_push: debtAlertPush,
        daily_whatsapp: dailyWhatsapp,
        daily_push: dailyPush,
        weekly_whatsapp: weeklyWhatsapp,
        weekly_push: weeklyPush,
        monthly_whatsapp: monthlyWhatsapp,
      });

      console.log('✅ Settings saved successfully:', response.data);
      Alert.alert('Éxito', 'Configuración de alertas guardada correctamente');

    } catch (error: any) {
      console.error('Error saving settings:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'No se pudo guardar la configuración'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      // Usar endpoint del backend que envía push remota + WhatsApp
      const response = await api.post('/api/notifications/test-all');
      
      const results = response.data.results;
      let message = '';
      
      if (results.push?.success) {
        message += '✅ Push enviada\n';
      } else {
        message += '❌ Push: ' + (results.push?.error || 'Error') + '\n';
      }
      
      if (results.whatsapp?.success) {
        message += '✅ WhatsApp enviado';
      } else {
        message += '❌ WhatsApp: ' + (results.whatsapp?.error || 'Error');
      }
      
      Alert.alert('Resultado', message);
    } catch (error) {
      console.error('Error testing notifications:', error);
      Alert.alert(
        'Error',
        'No se pudo enviar las notificaciones de prueba'
      );
    } finally {
      setTestingPush(false);
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
            Personaliza qué alertas quieres recibir por WhatsApp y Push Notifications.
          </Text>
        </View>

        {/* Contact Information - Solo WhatsApp */}
        <View style={styles.section}>
          <Text style={styles.sectionMainTitle}>📱 WhatsApp</Text>
          
          <View style={styles.inputGroup}>
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
        </View>

        {/* Alert Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionMainTitle}>⚙️ Preferencias de Alertas</Text>

          {/* Alertas de Stock Bajo */}
          <View style={styles.alertTypeCard}>
            <View style={styles.alertTypeHeader}>
              <View style={styles.alertTypeIconContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF9800" />
              </View>
              <View style={styles.alertTypeInfo}>
                <Text style={styles.alertTypeTitle}>Alertas de Stock Bajo</Text>
                <Text style={styles.alertTypeTime}>📅 Diarias - 8:00 AM</Text>
              </View>
            </View>
            
            <View style={styles.channelsRow}>
              <View style={styles.channelItem}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.channelLabel}>WhatsApp</Text>
                <Switch
                  value={stockAlertWhatsapp}
                  onValueChange={setStockAlertWhatsapp}
                  trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                  thumbColor={stockAlertWhatsapp ? '#25D366' : '#BDBDBD'}
                />
              </View>
            </View>
          </View>

          {/* Resumen Diario */}
          <View style={styles.alertTypeCard}>
            <View style={styles.alertTypeHeader}>
              <View style={[styles.alertTypeIconContainer, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="today" size={20} color="#2196F3" />
              </View>
              <View style={styles.alertTypeInfo}>
                <Text style={styles.alertTypeTitle}>Resumen Diario</Text>
                <Text style={styles.alertTypeTime}>📅 Diario - 8:00 PM</Text>
              </View>
            </View>
            
            <View style={styles.channelsRow}>
              <View style={styles.channelItem}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.channelLabel}>WhatsApp</Text>
                <Switch
                  value={dailyWhatsapp}
                  onValueChange={setDailyWhatsapp}
                  trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                  thumbColor={dailyWhatsapp ? '#25D366' : '#BDBDBD'}
                />
              </View>
            </View>
          </View>

          {/* Resumen Semanal + Insights */}
          <View style={styles.alertTypeCard}>
            <View style={styles.alertTypeHeader}>
              <View style={[styles.alertTypeIconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="calendar" size={20} color="#9C27B0" />
              </View>
              <View style={styles.alertTypeInfo}>
                <Text style={styles.alertTypeTitle}>Resumen Semanal + Insights IA</Text>
                <Text style={styles.alertTypeTime}>📅 Lunes - 9:00 AM</Text>
              </View>
            </View>
            
            <View style={styles.channelsRow}>
              <View style={styles.channelItem}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.channelLabel}>WhatsApp</Text>
                <Switch
                  value={weeklyWhatsapp}
                  onValueChange={setWeeklyWhatsapp}
                  trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                  thumbColor={weeklyWhatsapp ? '#25D366' : '#BDBDBD'}
                />
              </View>
            </View>
          </View>

          {/* Insights Mensuales */}
          <View style={styles.alertTypeCard}>
            <View style={styles.alertTypeHeader}>
              <View style={[styles.alertTypeIconContainer, { backgroundColor: '#E8EAF6' }]}>
                <Ionicons name="analytics" size={20} color="#3F51B5" />
              </View>
              <View style={styles.alertTypeInfo}>
                <Text style={styles.alertTypeTitle}>Insights Mensuales IA</Text>
                <Text style={styles.alertTypeTime}>📅 Día 1 de cada mes - 10:00 AM</Text>
              </View>
            </View>
            
            <View style={styles.channelsRow}>
              <View style={styles.channelItem}>
                <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
                <Text style={styles.channelLabel}>WhatsApp</Text>
                <Switch
                  value={monthlyWhatsapp}
                  onValueChange={setMonthlyWhatsapp}
                  trackColor={{ false: '#E0E0E0', true: '#C8E6C9' }}
                  thumbColor={monthlyWhatsapp ? '#25D366' : '#BDBDBD'}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionMainTitle}>📲 Notificaciones Push</Text>
          <Text style={styles.sectionDesc}>
            Recibe alertas instantáneas en tu dispositivo móvil
          </Text>
          
          <View style={styles.alertTypeCard}>
            <View style={styles.alertTypeHeader}>
              <View style={[styles.alertTypeIconContainer, { backgroundColor: '#F3E5F5' }]}>
                <Ionicons name="notifications" size={20} color="#9C27B0" />
              </View>
              <View style={styles.alertTypeInfo}>
                <Text style={styles.alertTypeTitle}>Alertas en Tiempo Real</Text>
                <Text style={styles.alertTypeTime}>
                  {expoPushToken ? '✅ Dispositivo registrado' : '⏳ Requiere app móvil'}
                </Text>
              </View>
              <Switch
                value={pushNotificationsEnabled}
                onValueChange={setPushNotificationsEnabled}
                trackColor={{ false: '#E0E0E0', true: '#E1BEE7' }}
                thumbColor={pushNotificationsEnabled ? '#9C27B0' : '#BDBDBD'}
              />
            </View>
            
            {pushNotificationsEnabled && (
              <>
                <Text style={styles.pushDescription}>
                  Las notificaciones push te avisan inmediatamente en tu dispositivo móvil (iOS/Android).
                </Text>
                
                {/* Sub-toggles for different push alert types */}
                <View style={styles.pushTogglesContainer}>
                  {/* Stock Alerts */}
                  <View style={styles.pushToggleRow}>
                    <View style={styles.pushToggleInfo}>
                      <Ionicons name="cube-outline" size={18} color="#FF9800" />
                      <Text style={styles.pushToggleLabel}>Stock Bajo/Agotado</Text>
                    </View>
                    <Switch
                      value={stockAlertPush}
                      onValueChange={setStockAlertPush}
                      trackColor={{ false: '#E0E0E0', true: '#E1BEE7' }}
                      thumbColor={stockAlertPush ? '#9C27B0' : '#BDBDBD'}
                    />
                  </View>
                  
                  {/* Debt Alerts */}
                  <View style={styles.pushToggleRow}>
                    <View style={styles.pushToggleInfo}>
                      <Ionicons name="cash-outline" size={18} color="#F44336" />
                      <Text style={styles.pushToggleLabel}>Deudas Pendientes</Text>
                    </View>
                    <Switch
                      value={debtAlertPush}
                      onValueChange={setDebtAlertPush}
                      trackColor={{ false: '#E0E0E0', true: '#E1BEE7' }}
                      thumbColor={debtAlertPush ? '#9C27B0' : '#BDBDBD'}
                    />
                  </View>
                  
                  {/* Daily Summary */}
                  <View style={styles.pushToggleRow}>
                    <View style={styles.pushToggleInfo}>
                      <Ionicons name="today-outline" size={18} color="#2196F3" />
                      <Text style={styles.pushToggleLabel}>Resumen Diario</Text>
                    </View>
                    <Switch
                      value={dailyPush}
                      onValueChange={setDailyPush}
                      trackColor={{ false: '#E0E0E0', true: '#E1BEE7' }}
                      thumbColor={dailyPush ? '#9C27B0' : '#BDBDBD'}
                    />
                  </View>
                  
                  {/* Weekly Insights */}
                  <View style={[styles.pushToggleRow, { borderBottomWidth: 0 }]}>
                    <View style={styles.pushToggleInfo}>
                      <Ionicons name="analytics-outline" size={18} color="#4CAF50" />
                      <Text style={styles.pushToggleLabel}>Insights Semanales IA</Text>
                    </View>
                    <Switch
                      value={weeklyPush}
                      onValueChange={setWeeklyPush}
                      trackColor={{ false: '#E0E0E0', true: '#E1BEE7' }}
                      thumbColor={weeklyPush ? '#9C27B0' : '#BDBDBD'}
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  style={[styles.pushTestButton, testingPush && styles.pushTestButtonDisabled]}
                  onPress={handleTestPush}
                  disabled={testingPush}
                >
                  {testingPush ? (
                    <ActivityIndicator color="#9C27B0" size="small" />
                  ) : (
                    <>
                      <Ionicons name="notifications-outline" size={18} color="#9C27B0" />
                      <Text style={styles.pushTestButtonText}>Probar Notificación</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
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
  sectionMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 16,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#757575',
    marginTop: -8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
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
    backgroundColor: '#FFF',
  },
  inputHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 6,
    fontStyle: 'italic',
  },
  alertTypeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  alertTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTypeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertTypeInfo: {
    flex: 1,
  },
  alertTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  alertTypeTime: {
    fontSize: 13,
    color: '#757575',
  },
  channelsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  channelItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  channelLabel: {
    fontSize: 14,
    color: '#424242',
    flex: 1,
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
  // Push Notifications Styles
  pushDescription: {
    fontSize: 13,
    color: '#757575',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  pushTogglesContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  pushToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  pushToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pushToggleLabel: {
    fontSize: 14,
    color: '#424242',
  },
  pushTestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E5F5',
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#CE93D8',
  },
  pushTestButtonDisabled: {
    opacity: 0.6,
  },
  pushTestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9C27B0',
  },
});
