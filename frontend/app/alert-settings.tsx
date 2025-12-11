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

export default function AlertSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Contact info
  const [emailAddress, setEmailAddress] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Individual alert preferences
  const [stockAlertEmail, setStockAlertEmail] = useState(false);
  const [stockAlertWhatsapp, setStockAlertWhatsapp] = useState(false);
  const [dailyEmail, setDailyEmail] = useState(false);
  const [dailyWhatsapp, setDailyWhatsapp] = useState(false);
  const [weeklyEmail, setWeeklyEmail] = useState(false);
  const [weeklyWhatsapp, setWeeklyWhatsapp] = useState(false);
  const [monthlyEmail, setMonthlyEmail] = useState(false);
  const [monthlyWhatsapp, setMonthlyWhatsapp] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin_ops/alert-settings');
      
      if (response.data) {
        setEmailAddress(response.data.email || '');
        setWhatsappNumber(response.data.whatsapp_number || '');
        setStockAlertEmail(response.data.stock_alert_email || false);
        setStockAlertWhatsapp(response.data.stock_alert_whatsapp || false);
        setDailyEmail(response.data.daily_email || false);
        setDailyWhatsapp(response.data.daily_whatsapp || false);
        setWeeklyEmail(response.data.weekly_email || false);
        setWeeklyWhatsapp(response.data.weekly_whatsapp || false);
        setMonthlyEmail(response.data.monthly_email || false);
        setMonthlyWhatsapp(response.data.monthly_whatsapp || false);
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
    const hasEmailAlerts = stockAlertEmail || dailyEmail || weeklyEmail || monthlyEmail;
    const hasWhatsappAlerts = stockAlertWhatsapp || dailyWhatsapp || weeklyWhatsapp || monthlyWhatsapp;

    if (hasEmailAlerts && (!emailAddress || !emailAddress.includes('@'))) {
      showAlert('Error', 'Por favor ingresa un email válido');
      return;
    }

    if (hasWhatsappAlerts && !whatsappNumber) {
      showAlert('Error', 'Por favor ingresa un número de WhatsApp');
      return;
    }

    try {
      setSaving(true);

      const response = await api.post('/api/admin_ops/alert-settings', {
        email: emailAddress.trim().toLowerCase(),
        whatsapp_number: whatsappNumber.trim(),
        stock_alert_email: stockAlertEmail,
        stock_alert_whatsapp: stockAlertWhatsapp,
        daily_email: dailyEmail,
        daily_whatsapp: dailyWhatsapp,
        weekly_email: weeklyEmail,
        weekly_whatsapp: weeklyWhatsapp,
        monthly_email: monthlyEmail,
        monthly_whatsapp: monthlyWhatsapp,
      });

      console.log('✅ Settings saved successfully:', response.data);
      showAlert('Éxito', 'Configuración de alertas guardada correctamente');

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
            Personaliza qué alertas quieres recibir y por qué canal (Email o WhatsApp).
          </Text>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionMainTitle}>📱 Información de Contacto</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>WhatsApp</Text>
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
                <Ionicons name="mail" size={16} color="#00D2FF" />
                <Text style={styles.channelLabel}>Email</Text>
                <Switch
                  value={stockAlertEmail}
                  onValueChange={setStockAlertEmail}
                  trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
                  thumbColor={stockAlertEmail ? '#00D2FF' : '#BDBDBD'}
                />
              </View>
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
                <Ionicons name="mail" size={16} color="#00D2FF" />
                <Text style={styles.channelLabel}>Email</Text>
                <Switch
                  value={dailyEmail}
                  onValueChange={setDailyEmail}
                  trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
                  thumbColor={dailyEmail ? '#00D2FF' : '#BDBDBD'}
                />
              </View>
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
                <Ionicons name="mail" size={16} color="#00D2FF" />
                <Text style={styles.channelLabel}>Email</Text>
                <Switch
                  value={weeklyEmail}
                  onValueChange={setWeeklyEmail}
                  trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
                  thumbColor={weeklyEmail ? '#00D2FF' : '#BDBDBD'}
                />
              </View>
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
                <Ionicons name="mail" size={16} color="#00D2FF" />
                <Text style={styles.channelLabel}>Email</Text>
                <Switch
                  value={monthlyEmail}
                  onValueChange={setMonthlyEmail}
                  trackColor={{ false: '#E0E0E0', true: '#B3E5FC' }}
                  thumbColor={monthlyEmail ? '#00D2FF' : '#BDBDBD'}
                />
              </View>
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
    gap: 12,
  },
  channelItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    gap: 6,
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
});
