import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Project ID de EAS
const EAS_PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId || '1d4993ea-b1c2-456d-bcf1-928c0dc0b80a';

// Configurar cómo se manejan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationService {
  private expoPushToken: string | null = null;

  // Registrar para recibir push notifications
  async registerForPushNotifications(): Promise<string | null> {
    console.log('📱 PUSH: Registering for push notifications...');

    // Verificar si es un dispositivo físico
    if (!Device.isDevice) {
      console.log('⚠️ PUSH: Must use physical device for Push Notifications');
      return null;
    }

    // Verificar/solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      console.log('📱 PUSH: Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ PUSH: Permission not granted');
      return null;
    }

    // Obtener el token de Expo Push
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '1d4993ea-b1c2-456d-bcf1-928c0dc0b80a', // YAPPA EAS Project ID
      });
      this.expoPushToken = tokenData.data;
      console.log('✅ PUSH: Token obtained:', this.expoPushToken);

      // Guardar token localmente
      await AsyncStorage.setItem('expoPushToken', this.expoPushToken);

      // Enviar token al backend
      await this.sendTokenToBackend(this.expoPushToken);

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ PUSH: Error getting token:', error);
      return null;
    }
  }

  // Enviar token al backend para guardarlo
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      await api.post('/api/notifications/register-token', {
        push_token: token,
        platform: Platform.OS,
      });
      console.log('✅ PUSH: Token registered with backend');
    } catch (error) {
      console.error('❌ PUSH: Error registering token with backend:', error);
    }
  }

  // Programar una notificación local
  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null, // null = inmediata
    });

    console.log('📬 PUSH: Local notification scheduled:', notificationId);
    return notificationId;
  }

  // Mostrar notificación de insight crítico
  async notifyInsight(type: 'critical_stock' | 'low_stock' | 'debt', message: string, entityId?: string): Promise<void> {
    const titles: Record<string, string> = {
      critical_stock: '🚨 ¡Stock Agotado!',
      low_stock: '⚠️ Stock Bajo',
      debt: '💰 Deuda Pendiente',
    };

    const icons: Record<string, string> = {
      critical_stock: '⚠️',
      low_stock: '📦',
      debt: '💰',
    };

    await this.scheduleLocalNotification(
      titles[type] || 'Yappa Insight',
      message,
      { type, entityId, screen: type === 'debt' ? 'customers' : 'inventory' }
    );
  }

  // Verificar y notificar insights críticos (llamar periódicamente)
  async checkAndNotifyInsights(): Promise<void> {
    try {
      console.log('🔍 PUSH: Checking for critical insights...');
      
      const response = await api.get('/api/ai/all-insights');
      const insights = response.data.insights || [];

      // Obtener últimas notificaciones enviadas
      const lastNotifiedStr = await AsyncStorage.getItem('lastNotifiedInsights');
      const lastNotified: string[] = lastNotifiedStr ? JSON.parse(lastNotifiedStr) : [];

      const criticalInsights = insights.filter(
        (i: any) => (i.type === 'critical_stock' || i.priority >= 8) && !lastNotified.includes(i.id)
      );

      if (criticalInsights.length > 0) {
        console.log(`📬 PUSH: Found ${criticalInsights.length} new critical insights`);
        
        // Notificar solo el más crítico para no saturar
        const mostCritical = criticalInsights[0];
        await this.notifyInsight(mostCritical.type, mostCritical.message, mostCritical.cta_data?.product_id);

        // Guardar que ya se notificó
        const newNotified = [...lastNotified, ...criticalInsights.map((i: any) => i.id)].slice(-50);
        await AsyncStorage.setItem('lastNotifiedInsights', JSON.stringify(newNotified));
      }
    } catch (error) {
      console.error('❌ PUSH: Error checking insights:', error);
    }
  }

  // Listeners para cuando se recibe o se toca una notificación
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Cancelar todas las notificaciones
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🗑️ PUSH: All notifications cancelled');
  }

  // Obtener el badge actual
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  // Establecer el badge
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
